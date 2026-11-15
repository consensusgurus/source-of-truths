// scripts/seated-words.mjs: who the Seated guests are to each other, and the words of
// every request. Used by scripts/gen-seated.mjs on every new board, and run once over the
// whole bank on 2026-11-15.
//
// Owner, 2026-11-15: "it needs to use only names from sudoclue. we will still create
// relationships between them like husband wife, uncles, parents, friends, etc in the same
// manner" (the same manner as the launch boards' Uncle Ted, Aunt May and Nana Pearl). So
// every guest is one of Sudoclue's cast (the chair shows their portrait) and carries a
// title for the evening: Uncle Barack, Aunt Oprah, Cousin Elon at a family dinner; Boss,
// Intern and Client at the office party; Classmate and Coach at the reunion; Donor and
// Trustee at the gala. On top of that some guests are tied to each other, and the request
// about them says so: a married couple who came together, a mother keeping an eye on her
// son, two brothers who are not speaking, a couple who used to be married. Their titles
// agree with the tie: a married couple is an aunt and an uncle (or grandma and grandpa, or
// Mom and Dad), a parent's child is a cousin, brothers and sisters share a title.
//
// Only the words change: `full` and `why`. The guests, the rules and the stored seating
// are never touched, so a played board keeps its answer and its saves.

// The cast members who are women (everyone else in lib/sudoclue-art.js is drawn as a man).
export const WOMEN = new Set(('Hillary Nancy Taylor Serena Meryl Nikki Laura Jill Maxine Deb Stacey Amy Liz Simone Mia Caitlin Megan Lindsey Venus Gabby Naomi Carli Julia Sandra Nicole Emma Viola Regina Cate Anne Halle Eva Zoe Angela Kristen Kerry Dolly Mariah Whitney Celine Ella Alicia Diana Janet Ariana Gloria Selena Carrie Kelly Tina Gwen Sheryl Martha Ruth Sonia Elena Sally Marie Jane Ada Mae Ellen Betty Lucille Carol Diane Barbara Katie Gayle Jenna Kamala Rosa Malala Joan Maggie Amelia Curie Austen Agatha Frida Beyonce Rihanna Adele Cher Shakira Gaga Aretha Marilyn Audrey Oprah Billie Tulsi Kristi Sarah Greta Zendaya Sabrina Olivia Kylie Kim Lizzo Dua Doja Cardi Nicki SZA Margot Swift Michelle Victoria Jennifer Savannah Katherine').split(' '));
export const isWoman = (n) => WOMEN.has(n);

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// What kind of room it is decides the titles.
const KIND = { 'Dinner Party': 'family', 'Birthday Dinner': 'family', 'Rehearsal Dinner': 'wedding', 'Wedding Reception': 'wedding', 'Office Party': 'office', 'Class Reunion': 'reunion', 'Charity Gala': 'gala' };
// a title for a guest with no tie: [for a woman, for a man]; `one` titles go to one guest a board at most
const SINGLE = {
  family: [['Cousin', 'Cousin'], ['Cousin', 'Cousin'], ['Neighbor', 'Neighbor'], ['Roommate', 'Roommate'], ['Great-Aunt', 'Great-Uncle'], ['Aunt', 'Uncle'], ['Aunt', 'Uncle']],
  wedding: [['Cousin', 'Cousin'], ['Cousin', 'Cousin'], ['Bridesmaid', 'Groomsman'], ['Neighbor', 'Neighbor'], ['Great-Aunt', 'Great-Uncle'], ['Aunt', 'Uncle'], ['Grandma', 'Grandpa']],
  office: [['Coworker', 'Coworker'], ['Coworker', 'Coworker'], ['Manager', 'Manager'], ['Intern', 'Intern'], ['Client', 'Client'], ['Temp', 'Temp']],
  reunion: [['Classmate', 'Classmate'], ['Classmate', 'Classmate'], ['Classmate', 'Classmate'], ['Class Clown', 'Class Clown']],
  gala: [['Donor', 'Donor'], ['Donor', 'Donor'], ['Sponsor', 'Sponsor'], ['Trustee', 'Trustee'], ['Doctor', 'Doctor'], ['Judge', 'Judge']],
};
const ONE = {
  family: [['Nana', 'Pop'], ['Godmother', 'Godfather']],
  wedding: [['Maid of Honor', 'Best Man'], ['Godmother', 'Godfather']],
  office: [['Boss', 'Boss']],
  reunion: [['Principal', 'Principal'], ['Prom Queen', 'Prom King'], ['Teacher', 'Teacher'], ['Coach', 'Coach'], ['Cheer Captain', 'Quarterback'], ['Drummer', 'Drummer'], ['Yearbook Editor', 'Yearbook Editor']],
  gala: [['Chairwoman', 'Chairman'], ['Auctioneer', 'Auctioneer'], ['Mayor', 'Mayor']],
};
// the titles a married couple can share: [hers, his]
const COUPLE = { family: [['Aunt', 'Uncle'], ['Grandma', 'Grandpa'], ['Mom', 'Dad']], wedding: [['Aunt', 'Uncle'], ['Grandma', 'Grandpa']] };

// What two people who are tied to each other say. {A} {B} are the two titled names in the
// rule's own order; {P} {C} parent and child; the words after the tie are the request.
const TIE = {
  married: {
    next: ['{A} and {B} are married. They came together.', '{A} and {B} are married. They do everything side by side.', '{A} and {B} are newlyweds.'],
    same: ['{A} and {B} are married. They want to share a table.', '{A} and {B} are married and want to keep an eye on each other.'],
    across: ['{A} and {B} are married. They like to look at each other.', '{A} and {B} are married and still make eyes across the table.'],
  },
  sweethearts: {
    next: ['{A} and {B} were high school sweethearts. Now they are married.'],
    same: ['{A} and {B} were high school sweethearts and married after school.'],
    across: ['{A} and {B} were high school sweethearts. They married, and still make eyes across the table.'],
  },
  parent: {
    next: ['{P} is {C}’s {mom}. They came together.', '{P} is {C}’s {mom} and is driving {them} home.'],
    same: ['{P} is {C}’s {mom} and wants to keep an eye on {them}.', '{P} wants a word with {C}, {his} {son}.'],
    across: ['{P} is {C}’s {mom} and wants to see {them} across the table.'],
    apart: ['{C} is not speaking to {P}, {his2} {mom2}. They had words in the car.', '{P} is {C}’s {mom}. They need a night apart.'],
    notnext: ['{C} loves {P}, {his2} {mom2}, but wants a little space.', '{P} is {C}’s {mom} and will not stop fixing {his3} collar.'],
  },
  sibs: {
    next: ['{A} and {B} are {sibs}. They came together.', '{A} and {B} are {sibs} and have not seen each other in years.'],
    same: ['{A} and {B} are {sibs} with catching up to do.'],
    across: ['{A} and {B} are {sibs} with a staring contest to finish.'],
    apart: ['{A} and {B} are {sibs} and are not speaking.', '{A} and {B} are {sibs} and argue about everything.', '{A} and {B} are {sibs}. One of them still owes the other money.'],
    notnext: ['{A} and {B} are {sibs} and have heard each other’s stories.', '{A} and {B} are {sibs}. They kick under the table.'],
  },
  exes: {
    apart: ['{A} and {B} used to be married.', '{A} and {B} were engaged once.'],
    notnext: ['{A} and {B} used to be married. Not side by side, please.', '{A} and {B} dated in college. It ended badly.'],
  },
  friends: {
    next: ['{A} and {B} are best friends.', '{A} and {B} were college roommates.'],
    same: ['{A} and {B} are old friends with catching up to do.'],
    across: ['{A} and {B} are best friends and talk with their hands.'],
  },
  pals: {
    next: ['{A} and {B} were lab partners.', '{A} and {B} were best friends in school.'],
    same: ['{A} and {B} sat together in homeroom.'],
    across: ['{A} and {B} were on the debate team together.'],
  },
};
// the plain words for a request between two people with no tie (and for the table requests)
const WHY = {
  apart: ['{A} and {B} are not speaking.', '{A} still owes {B} money.', '{A} and {B} argue about everything.', '{A} beat {B} at cards and will not let it go.', '{A} and {B} fell out over a parking spot.', '{A} told the story about {B} again.', '{A} and {B} both want to give the toast.'],
  next: ['{A} and {B} came together.', '{A} promised to sit with {B}.', '{A} only knows {B}.', '{B} is the ride home for {A}.', '{A} and {B} have not seen each other in years.', '{A} is looking after {B} tonight.'],
  notnext: ['{A} and {B} never stop talking shop.', '{A} hums. {B} cannot stand it.', '{A} would rather not be right beside {B}.', '{A} and {B} share one bad joke between them.', '{B} takes food off the plate of {A}.'],
  across: ['{A} likes to face {B} when they talk.', '{A} reads lips and wants to see {B}.', '{A} and {B} have a staring contest to finish.', '{A} wants to watch {B} open the gift.'],
  same: ['{A} has stories for {B}.', '{A} and {B} want to catch up.', '{A} wants to keep an eye on {B}.', '{A} and {B} are splitting a dessert.', '{B} laughs at every joke {A} tells.'],
  table: {
    'by the door': ['{A} has to leave early.', '{A} wants to greet everyone coming in.', '{A} needs the easy way out.'],
    'by the band': ['{A} came for the music.', '{A} knows the drummer.', '{A} has a request for every song.'],
    'by the window': ['{A} wants the view.', '{A} likes the fresh air.', '{A} is watching the car.'],
    'by the bar': ['{A} is buying the rounds.', '{A} knows the bartender.', '{A} is in charge of the toasts.'],
  },
  nottable: {
    'by the door': ['{A} feels the draft by the door.', '{A} hates being bumped by the door.'],
    'by the band': ['{A} cannot hear a thing by the band.', '{A} gets a headache by the band.'],
    'by the window': ['{A} gets the sun in the eyes by the window.', '{A} is cold by the window.'],
    'by the bar': ['{A} would rather be far from the bar.', '{A} finds the bar too loud.'],
  },
};

// Dress one board in place: sets every guest's `full` and every rule's `why`.
export function dress(row) {
  const R = rng(hash(`seated-words-${row.live}`));
  const pick = (a) => a[Math.floor(R() * a.length)];
  const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const kind = KIND[row.event] || 'family';
  const G = row.guests, N = G.length, w = G.map((g) => isWoman(g.n));
  const title = new Array(N).fill(null), tie = new Array(row.rules.length).fill(null), tied = new Set();
  const usedOne = new Set();
  // 1. the ties: about one request in three between two people, each guest in one tie at most
  const cap = Math.max(1, Math.round(row.rules.filter((r) => r.b != null).length * 0.4));
  let made = 0;
  for (const i of shuf(row.rules.map((_, k) => k))) {
    const r = row.rules[i];
    if (r.b == null || tied.has(r.a) || tied.has(r.b) || made >= cap) continue;
    const mixed = w[r.a] !== w[r.b], warm = r.t === 'next' || r.t === 'same' || r.t === 'across';
    const opts = [];
    if (warm && mixed) opts.push(kind === 'reunion' ? 'sweethearts' : 'married', kind === 'reunion' ? 'sweethearts' : 'married');
    if (kind !== 'reunion') opts.push('parent');
    if (kind === 'family' || kind === 'wedding') opts.push('sibs', 'sibs');
    if (!warm && mixed) opts.push('exes');
    if (warm) opts.push(kind === 'reunion' ? 'pals' : 'friends');
    if (!opts.length) continue;
    const k = pick(opts);
    if (!TIE[k][r.t]) continue;
    const t = { k };
    if (k === 'parent') { t.p = R() < 0.5 ? r.a : r.b; t.c = t.p === r.a ? r.b : r.a; }
    tie[i] = t; tied.add(r.a); tied.add(r.b); made++;
    // the titles that go with the tie
    const fam = kind === 'family' || kind === 'wedding';
    if (k === 'married' || k === 'sweethearts') {
      let pair = fam ? pick(COUPLE[kind].filter((p) => !(p[0] === 'Mom' && usedOne.has('Mom')))) : null;
      if (pair && pair[0] === 'Mom') usedOne.add('Mom');
      for (const g of [r.a, r.b]) title[g] = pair ? pair[w[g] ? 0 : 1] : null;
    } else if (k === 'parent' && fam) {
      title[t.p] = w[t.p] ? 'Aunt' : 'Uncle'; title[t.c] = 'Cousin';
    } else if (k === 'sibs') {
      const pair = pick([['Cousin', 'Cousin'], ['Aunt', 'Uncle']]);
      for (const g of [r.a, r.b]) title[g] = pair[w[g] ? 0 : 1];
    }
  }
  // 2. everyone else's title: the room's one-off titles first, then the common ones
  const rest = shuf(G.map((_, i) => i).filter((i) => title[i] == null));
  for (const pair of shuf(ONE[kind])) {
    if (!rest.length || R() < 0.25) continue;
    if (pair[0] === 'Mom' && usedOne.has('Mom')) continue;
    const g = rest.shift(); title[g] = pair[w[g] ? 0 : 1];
  }
  for (const i of rest) title[i] = pick(SINGLE[kind])[w[i] ? 0 : 1];
  G.forEach((g, i) => { g.full = `${title[i]} ${g.n}`; });
  // 3. the words
  const used = new Set();
  const choose = (list) => { let s = pick(list); for (let i = 0; i < 12 && used.has(s); i++) s = pick(list); used.add(s); return s; };
  row.rules.forEach((r, i) => {
    const A = G[r.a].full, B = r.b == null ? '' : G[r.b].full, t = tie[i];
    let s;
    if (r.b == null) s = choose(WHY[r.t][row.tables[r.table].note]).replace(/\{A\}/g, A);
    else if (!t) s = choose(WHY[r.t]).replace(/\{A\}/g, A).replace(/\{B\}/g, B);
    else if (t.k === 'parent') {
      const P = G[t.p].full, C = G[t.c].full, pw = w[t.p], cw = w[t.c];
      s = choose(TIE.parent[r.t]).replace(/\{P\}/g, P).replace(/\{C\}/g, C)
        .replace(/\{mom\}/g, pw ? 'mother' : 'father').replace(/\{mom2\}/g, pw ? 'mother' : 'father')
        .replace(/\{them\}/g, cw ? 'her' : 'him').replace(/\{his\}/g, pw ? 'her' : 'his').replace(/\{son\}/g, cw ? 'daughter' : 'son')
        .replace(/\{his2\}/g, cw ? 'her' : 'his').replace(/\{his3\}/g, cw ? 'her' : 'his');
    } else {
      const sibs = w[r.a] && w[r.b] ? 'sisters' : !w[r.a] && !w[r.b] ? 'brothers' : 'brother and sister';
      s = choose(TIE[t.k][r.t]).replace(/\{A\}/g, A).replace(/\{B\}/g, B).replace(/\{sibs\}/g, sibs);
    }
    r.why = s;
  });
  return row;
}
