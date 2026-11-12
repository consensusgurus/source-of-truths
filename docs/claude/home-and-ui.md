# Home page, slate, Loft, palette and registers (light/dark), contrast traps, game-page chrome, caps, endings and curtains, pop-ups, how-to-play sheet, touch input

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: Home page, slate, Loft, palette and registers (light/dark), contrast traps, game-page chrome, caps, endings and curtains, pop-ups, how-to-play sheet, touch input

## Category shelf headers are FILLED BANDS in real hues (owner, 2026-08-25)

The category shelves on the marquee home (`app/today/TodayClient.jsx`, `.tdy-hd`) carry a header
strip filled SOLID with that category's colour, white ink, white CTA. It was a 9% tint plus a 4px
rule. **This supersedes the one-blue-family ruling of 2026-08-04 FOR `CAT_BLUE` ONLY.** `DEPT_BLUE`
(the live feed, sixteen departments as small chips) is unchanged and still one blue family; that
part of the ruling stands.

**Why the ruling moved, in one measurement.** A filled band is a different problem from a 7px dot:

| | hue spread | L* spread |
|---|---|---|
| one blue family (old `CAT_BLUE`) | 43 deg | 21.5 |
| real hues (new) | 328 deg | 14.4 |

Read the right way round, that is backwards for a band. The shelves differed in how DARK they were
rather than in what colour they were, so Word (24.6 L*) read as heavier and more important than
Trivia (46.1 L*), a ranking nobody intended. Real hues invert it: distinct colours at near-equal
weight. Filling the band therefore FORCED the hue decision, and there is no cheap middle, a
blue-family tint differentiates nothing either.

**Two rules for any surface that fills a band with these:**

1. **Never dim band ink with opacity.** Every hue clears 4.5:1 against PURE white and has no
   headroom past it, so white at .78 lands at 3.46 on Word and the 9.5px eyebrow fails. Hierarchy
   comes from size and weight. Same reason the leader chip keeps opaque gold rather than becoming a
   white wash of the hue, which fails on five of the ten categories.
2. **Adjacent shelves in `CAT_ORDER` must sit >=30 deg apart in hue** so neighbours are always
   tellable. Changing one value means re-checking its neighbours, not just its own contrast.

**Knock-on, deliberate:** `catBlue` is imported by `DailyStrip`, `HomeRails` and `QuizHomeClient`
too, so the category dots, the mastery bars, the Loft category slips and the last-played chips all
take the real hues in the same push. Audited before shipping: the only other place that puts TEXT
on the colour is `DailyStrip`'s `.dh-tcat` (white on `catCol`), which every hue clears.

**The name `CAT_BLUE` is now historical** and the values are not blues. Renaming it is mechanical
across six call sites and should be its own commit, never folded into a colour edit.

## Phone home layout: direction B (owner-approved 2026-08-07)

The homepage's PHONE layout (<=900px) is deliberately built out of the four moves the two cap
bars already make, because those bars plus the navy header are the part the owner signed off on:
a solid saturated ground, a 4px left rule where an icon used to be, a small uppercase eyebrow
over a big 800-weight name, and one control on the right edge. **The DESKTOP layout is
unchanged and must stay unchanged.** Every rule below lives inside `@media(max-width:900px)`;
the only base-level additions are neutralisers (`display:none`) that keep the desktop render
byte-identical.

**Slate (`app/DailyStrip.jsx`)**

- **Rows group by state under solid bands:** Ready to play / Done today, each with its count.
  There is NO In progress band: a paused game is a Ready-to-play row at the FOOT of that group
  (see the paused-row rule under the cap section below). The bands are pushed FIRST in
  `renderSlate` and placed by CSS `order` inside the media query (todo band 4, untouched rows 5,
  paused rows 6, todo bar 7, done band 8, done rows 9), NOT interleaved in JS. That is what keeps the desktop source order, and therefore the sortable
  column headers, exactly as they were. `.dh-board.slate` becomes `display:flex;flex-direction:
  column;gap:0` on a phone for this, and **the `gap:0` is load-bearing**: the tile board sets
  `gap:7px` on `.dh-board` in the 640px block, which a flex container reads as a 7px white band
  between every row (that shipped once and the owner caught it). A row and its own drawer carry the SAME order value and
  equal-order flex items keep source order, so a drawer never leaves its row: any new per-row
  element must follow that rule or it will float out of its group.
- **The peek is six UNPLAYED games, and only unplayed ones** (`PHONE_ROWS = 6`, `TABLET_ROWS = 12`
  from 641px where the slate runs two across; owner 2026-08-08, tightening the 08-07 budget): the
  collapsed slate is the "what should I play next" screen, so every line of it goes to a game you
  have NOT started. Paused rows peek ZERO and wait for the expand bar, because they are already on
  screen as cap cards directly above the board and restating two of them cost a third of the peek to
  say nothing new. `renderSlate` therefore measures the peek against each sub-group's own index
  (`bucket`, `progPeek = 0`) rather than one running count, and the bar's count is the unplayed
  overflow PLUS every paused row. A fixed count per group made the first screen swing by a whole group's
  worth of rows depending on how many games you happened to have paused. Finished games sit outside
  the budget and peek NOTHING: you
  already know how you did, so the band plus its bar is the whole group until you ask. The reason is
  the rails, not tidiness: with all 51 rows listed, the leaderboard panels and Featured sat a very
  long scroll below the fold. Collapsed is the default on every load, since the point is what the
  first screen shows. **Collapsing a group scrolls the bar back into view**: taking 34 rows out of
  the page otherwise leaves the reader wherever those rows used to be, a long way from the bar they
  just pressed. Ordered slots now, ONE bar for the whole Ready-to-play group: todo
  4-5-6-7 (band, untouched rows, paused rows, bar), done 8-9. A hidden row's drawer inherits `.sl-hid` so collapsing never leaves a panel
  with no row above it. **A filter suspends the peek**: any filter other than All shows every paused
  and unplayed row with no bar, because the filter already IS the reader narrowing the slate and
  peeking inside it answers that request with another lid. Finished games stay collapsed regardless
  (`peekOf` in `renderSlate`). **Anything that sets `display` on a `.sl-row` inside the slate must exclude
  `.sl-hid`** — the `.mcut` rule in the 640px block outranks it on specificity AND source order, so
  it carries a `:not(.sl-hid)` guard.
- **Row shape: THREE tracks, name / count / icon, and NOTHING on the row is a control** (owner,
  2026-08-07, against a reference image). The row previously carried a star, a tile plate, the name,
  a Play button and a chevron: five things competing with the one that matters on a 390px line.
  Everything that was a control left. **The whole row expands the drawer**, Play now lives at the top
  of that drawer with the other chips, and the pin lives there too, so `.sl-fav`, `.sl-status` and
  `.sl-arch` are all `display:none` and the pins grid is identical to the plain one. What is left is
  the title at 18px with the category as small caps BESIDE it (owner, 2026-08-07: above the name it
  was a third line of type competing with the title; beside it, it is a footnote, and the row comes
  out shorter despite the bigger name). `.sl-nm` is a wrapping flex ROW and the order property does
  the arranging, since the DOM order is category, name, sub; a 100% flex-basis on the sub breaks it
  onto its own line and baselines align, so the tiny caps sit on the title's baseline. Then the tagline
  and leader on the sub line separated by `.sl-dot`, the crowd size as a stacked right-edge figure
  (`.sl-pl`), and the game's bare emblem on the right edge where the Play button used to sit. The
  icon moves there with `order` (grid honours it) rather than a JSX change, and it carries NO plate:
  at the right edge a filled rounded box reads as the button that used to be there.
  `.sl-npl`, the count inside the name line, is kept but unused; that count has been swapped once
  already. a11y: with the chevron gone the row's focusable child is the name link, and activating it
  expands rather than navigating.
- **The category filter is a dark strip of pills** (`#2c4fa8` ground, white pill for the active
  one), so it reads as part of the navy slate header above it. Desktop keeps its light underline
  tabs.
- **One element per width, never a shared one that has to compromise:** the phone count is
  `.sl-npl` inside the name line and the desktop count is the `.sl-pl` column, each
  `display:none` at the other width, so neither is announced twice and neither constrains the
  other. Same for `.sl-cm` / `.sl-mld` / `.sl-tg`, all `display:none` above 900px, which is why the
  JSX can reorder them freely. `.sl-pl` still wraps its number in `<b>` with an `<i>` label from
  the first pass; both are neutralised at base so the desktop column renders a bare centred
  number.
- **The sub line is a flex row** with the tagline (`.sl-tg`) as the shrinking item and the leader
  chip `flex:none`, so a long tagline ellipsizes itself instead of pushing the leader out of the
  line.
- **A tap anywhere on the row opens the stats + archive drawer, and Play / Resume is the only
  control that still navigates into the game.** Implemented as an `onClick` on `.sl-row` gated
  with `matchMedia('(max-width: 900px)')` at CLICK time, not on a rendered flag, so the markup is
  identical on the server and the desktop row keeps its old behaviour (name links to the game,
  chevron opens the drawer) with no hydration branch. The handler bails on
  `.sl-btn.play,.sl-btn.prog,.sl-ab,.sl-favb` and otherwise `preventDefault()`s to swallow the
  name link's navigation. `.sl-btn.done` is a static score chip, not a control, so it falls
  through and expands like the rest of the row.

**Cap (`.dh-sbar`) carries the PAUSED games too (owner, 2026-08-08)**

The cap is no longer two halves. It is a grid of cap-shaped cards, two to a row above 900px and
one below: Up next, Easiest leaderboard, then one card per PAUSED game, in board order. The blue
pair keeps its two navy tones; the paused cards take the slate's gold (`var(--gold)` ground,
`#2a1f04` ink, white button). Consequences, all of which are the point rather than side effects:

- **The board has no In progress BAND, but it does still list the paused games** (owner,
  2026-08-08, reversing the same day's "keep them out of the board" call). Filtering them out
  entirely left a game you had started findable in exactly one place, and only while the cap still
  had a slot for it. So `renderSlate` sorts them to the BOTTOM of Ready to play (`arr` is a stable
  three-way partition: untouched, paused, finished) and they render as ORDINARY rows with faint
  shading, the base `#fffaeb` ground plus the gold left rule, never the cap's gold card: that shape
  is already on screen directly above the board, and repeating it made the same card twice on one
  page. Their Resume chip WAITED on no hover until 2026-08-12, when the owner put the crowd size
  back on every state row (see the next bullet); it is a hover state now like every other chip.
  Appearing in both the cap and the slate is deliberate, the cap promotes the first two and the
  slate is the copy you can always scroll to.
- **EVERY STATE ROW CARRIES THE `# PLAYING` FIGURE, AND EVERY CHIP WAITS FOR A HOVER** (owner,
  2026-08-12). The crowd size used to belong to Ready to play alone: a finished row hid it behind a
  permanent score chip, an incomplete one behind Retry, and a paused one behind Resume. So the one
  column the slate is read DOWN, "how many people are on this today", had holes in it exactly where
  you had already played, which is where you are most likely to be looking. The figure is the
  resting state on all four groups now and the chip is what the hover swaps in, which is the model
  Ready to play already used. Nothing is lost: the score is the chip, one hover away, and it is also
  in the row's drawer. Three rules in the `min-width:901px` block carry it, and they are the ones to
  look at if this ever regresses: `.sl-status` is `opacity:0` for every row (only `.sl-row.sun`, the
  Sunday Editions link list, keeps a permanent chip, since it has no count to give way to), the
  `visibility:hidden` that used to hide `.sl-pl` on `.inprog` / `.done` / `.fail` is gone, and the
  `hover:hover` block lost its `:not(.done)`. The phone (<=900px) is untouched: it shows no chips at
  all and already showed the figure on every row.
- **Collapsed to TWO cards at BOTH widths** (`CAP_PROG_D` / `CAP_PROG_M`), which is exactly one row
  of the desktop grid, with the rest behind one `.dh-cmore` bar spanning the cap's columns. It ran
  four and three for one deploy and the console outgrew the fold; two is the owner's number
  (2026-08-08). The cut is CSS on the cards (`.cap-hd` / `.cap-hm`), NOT a slice in the JSX, so the
  server and the client render the same list at both widths and each width prints its own count.
- **The board's height is MEASURED, never a hardcoded sum.** It used to be
  `calc(100vh - 300px)`, where 300 was everything above it in the console; the cap changed height
  and the whole three-column row ran ~200px past the fold (the rails stretch to the console, so all
  three columns break together). A `useEffect` in `DailyStrip.jsx` now sets `--dh-fit` on the board
  from its own document top: `innerHeight - top - FOLD_SLIVER`, floored at `BOARD_MIN`, re-run on
  resize and from a `ResizeObserver` on the CAP (never on the console, whose height the board
  drives, or it loops). Desktop only; the phone board is `height:auto`. Anything that changes the
  cap's height therefore needs no number updated anywhere.
- **A paused card is ONE link**, the whole card, with the Resume button as a `<span>` inside it
  (never a nested `<a>`). Up next and Easiest are excluded from the paused list, since they are
  frequently paused games themselves and already have a card.
- **NO CARD IS EVER WIDENED: the cap pays for parity with a card, not with width** (owner,
  2026-08-11). An odd count used to leave the last card spanning both columns, and a lone banner
  where a card should be reads as a bug rather than a layout. SHUT, the lead cards already held the
  grid at four. OPEN they had stepped aside entirely, so three paused games gave five cards and the
  third one stretched. Now `want` in `capLead` is parity-driven when open: an odd block brings ONE
  lead card back, and it renders INSIDE the block as its last tile (`capLeadIn`), not above it,
  because the open block is its own grid and a card above would be the odd one on the fixed row
  instead. Three paused games therefore read three blue over three gold, every card the same size;
  shut is unchanged at four. `.capw` stays as the backstop for a state that cannot reach an even
  number (no lead game left to draw on), and `capOddD` counts the in-block card so it never
  misfires.
- **Every card's button is `flex:0 0 <width>`, not a bare `width`**: as a flexible item a long name
  or sub line squeezed its own control and the cards came out visibly unequal.
- **`.dhome.slate .dh-sbar` carries `border:none` above 900px.** Its 1.5px grey SIDE borders were an
  indentation against the title band above it, whose border is the colour of its own fill.
- **The category strip is NAVY (`var(--accent)`) with white type**, and the selected tab still marks
  itself with a white UNDERLINE, not a pill (owner, 2026-08-08). The phone keeps its own `#2c4fa8`
  pill strip.
- **The expand bars sit on `#e8edf5` between two 2px `#c2ccdc` rules.** On `--surface` between two
  `--border` hairlines they dissolved into the page at the console's edge.
- **A group that shows NOTHING has no expand bar: its BAND is the toggle** (owner, 2026-08-08). Done
  today peeked zero rows, so a band reading "Done today 6" sat on a bar reading "Show all 6", two
  rows for one shut group. The band renders as a `<button>` with a chevron and `more()` returns null
  when `peekOf(grp) === 0`. Done is collapsed at BOTH widths now (`.sl-row.done.sl-hid` is hidden in
  the desktop block too, scoped to `.done` because the same class marks the Ready-to-play rows
  outside the PHONE's six-row budget, which desktop deliberately lists in full). A group that peeks
  SOME rows keeps its bar, since there the bar counts what is still hidden. **`globals.css` rounds
  every `<button>` to 8px, so any full-width band or bar built out of one needs `border-radius:0`.**

**Contest terms live in `app/ContestNote.jsx`, and EVERY share pop-up renders it (owner, 2026-08-08).**
A button that names a dollar figure has to land the reader somewhere that states the prize, the
deadline and the rules. `ShareCreditPop` (the global one) and the quiz-home "How to get credit" modal
both render `<ContestNote />`; it reads `contestIsLive()` in an effect and renders nothing outside the
window, and every figure in it comes from `lib/contest`. Do not restate the terms inline anywhere: add
the component. The quiz-home header CTA itself is gold (`.qchm-bt.qchm-gold`) and reads
`Share for ${CONTEST.prizeLabel}*`, from the constant, never a literal.

**Puzzle drawer (`app/DailyTilePanel.jsx`)**

- The phone drawer follows the SAME rules, at the SAME 900px breakpoint as the slate (it was 720px,
  which left 721-900px pairing a phone slate row with a desktop-shaped drawer). It was a 13px-padded
  white panel holding five rounded, bordered cards, with the 2x2 stat tiles bordered again inside
  one of them, directly under rows that run edge to edge.
- **The phone drawer is TWO-LEVEL** (owner, 2026-08-07): opening a row shows the button strip and
  three collapsed bands, **Your record / Leaderboards / Archive**, and nothing else. Each opens one
  block; it is an ACCORDION (one at a time, `sec` state in `DailyTilePanel`), because the whole point
  is height. The single-level version ran ~1,100px, three screens for a drawer you opened to check
  one number. "Your last N days" lives inside Your record. The mechanism is `display:contents` on
  `.dtp-grid`, which promotes the three cards to children of `.dtp` (already a flex column) so the
  cards, `.dtp-trend` and the bands are all siblings and `order` can interleave them band / content /
  band / content. That is the ONLY way to get `.dtp-trend` under the Your record band without moving
  it in the JSX, since it lives outside `.dtp-grid`. A section's own first label is hidden where it
  would repeat the band that opens it.
- **Every card becomes a dark band plus full-width content**, and each piece reuses an object the
  page already ships: `.dtp-lab` becomes the slate's `.sl-band`; `.dtp-stats` becomes the page
  header's 4-up divided strip; `.dtp-row` / `.dtp-lrow` become full-width hairline rows; the
  leaderboard `#1` takes the rails' gold rule (`.first`, a class that is inert above 900px) and
  `you` takes the blue one, with `.me` ordered AFTER `.first` so being #1 yourself reads as you.
  The calendar spans the full width, so its cells grow.
- **Share and Play are two flush half-width rectangles at the top, Play on the right** (owner,
  2026-08-07). `flex:0 0 50%` on each reserves the line for exactly those two, so every remaining
  chip wraps below; the strip therefore carries no side padding and the second-line chips supply
  their own inset as margins. Share reads **"Share for $20*"**, naming the contest prize.
- **Today's leaderboard rows carry the GAME stats** (score, guesses, clock) on their own line under
  the name, via `gameStats(r)` over the board row's `score` / `total` / `guessesUsed` /
  `timeElapsed`, alongside the 0-15 ranking points. Phone only (`.dtp-lst`): the desktop column is
  320px and already tight with three cells on one line. Implemented with `flex-wrap` plus a 100%
  basis rather than a wrapper element, so the desktop row is untouched.
- **Play is at the top of the drawer, first in the navy strip** (owner, 2026-08-07), because the
  slate row no longer carries one. `.dtp-idt` and `.dtp-nm` go `display:contents` so the chips and
  Play are flex items of ONE strip rather than two nested boxes, which is what lets Play join the
  chip row without moving it in the JSX; `.dtp-acts` takes `order:-1` to lead and
  `flex-basis:100%` to claim a LINE OF ITS OWN, with the chips wrapping underneath. That basis is
  the whole point: it is the one control in the drawer that starts the game, and sharing a row with
  four pill chips sized it like a fifth chip (owner, 2026-08-07). The top Close
  (`.dtp-shrink`) leaves, since the drawer ends in a full-width Close bar.
- **The button strip is navy and its buttons spread across the width.** `flex:1 1 auto`, NOT `1 1 0`:
  an equal-thirds split sizes every chip to the longest label, which leaves the streak flame in a
  third of empty space and can still truncate "Pin to your games". Growing from natural width spends
  the slack evenly, fills the strip, and never truncates, at any chip count from two to four.
- **A full-width Close bar sits at the FOOT** (`.dtp-mclose`, phone only). The row's chevron still
  closes the drawer, but it runs past a screen, so closing should not mean scrolling back up to it.
- The desktop drawer is untouched: three bordered cards side by side, equal heights driven by the
  calendar's six padded week rows.

**Rails (`app/HomeRails.jsx`)**

- Each ranked panel promotes its **#1 into a hero slab** on a phone: eyebrow, big name, sub, big
  figure, gold left rule. Rendered by `Rows` from a `hero={{eyebrow, sub, unit, tone}}` prop, with
  `.hr-tbl tr.lead1` hidden below 900px so the list starts at 2, and the panel's grey sub-strip
  folded into the slab (`.hr-panel:has(.hr-hero) .hr-sub{display:none}`, so a board with no rows
  keeps its descriptor). Both renders sit in the DOM at once; `display:none` keeps the hidden one
  out of the accessibility tree, so nothing is announced twice.
- The slab ground is **blue, not the header's navy**: `.hr-ph` stays visible because it carries the
  contest countdown and the flip panel's face switcher, which a phone still needs, so a navy slab
  would abut a navy header with no edge. Blue over navy is the cap bars' own pairing. `tone:
  'lite'` gives the lighter `#4d84f3` so two adjacent rails do not read as one block.
- Live feed and Featured were the last two elements left on the old look; they were brought over
  2026-08-10, at every width. See the next section.

**When adding anything to the phone home surface, match these tokens** (`globals.css` +
`lib/home-blues.js`), and keep every rule inside the media query. A mock-up of the three
directions considered lives at `mobile-home-mockups.html` in the repo root.

## Desktop slate: the open panel owns the console, and no band ever hides (owner, 2026-08-12)

Three rules for `app/DailyStrip.jsx` above 901px. All three live in the `@media(min-width:901px)`
slate block; the phone slate (`<=900px`) is untouched by every one of them.

**The open panel fills `.dhome`, not the board window.** `.dtp` (`app/DailyTilePanel.jsx`) is
`position:absolute;inset:0;overflow:hidden`, so it fills its nearest POSITIONED ancestor and clips
the rest. On the slate that ancestor was `.dh-vp`, whose height is the MEASURED `--dh-fit`, and the
panel is taller than that at every desktop size, so the foot of the record chart was simply cut off
with no way to reach it. `.dhome.slate .dh-boardwrap,.dh-vpwrap,.dh-vp{position:static}` hands the
panel `.dhome` instead, which is the same box the TILE board's panel has always filled (one expanded
console, one Play button, 2026-07-29), and adds the title band, the cap and the filter strip to its
height: 723px against the board's 472px. All three wrappers are positioned only for tile-board
furniture (`.dh-vp.on`'s translateY window and the `.dh-more` pager), and BOTH are gated on `!slate`
in the JSX, so nothing at this width loses a containing block. `overflow:auto` on the slate panel is
the backstop for a short viewport, and `.dtp-grid{flex:1 1 auto}` (slate only) spends the extra
height on the record chart and the standings rather than leaving ~150px of white under the calendar.

**The panel is FLUSH at the top.** `border-radius:0 0 13px 13px`. It starts on the console's own top
edge now, and a 13px radius there read as a card floating inside the console rather than as the
console. The bottom keeps the radius, because that IS the console's bottom edge.

**Every group band stays visible, at whichever edge it belongs to.** `top:0` alone only pinned a band
once you had scrolled PAST it, so Complete today, last in the flow, sat ~1,370px down a 472px port:
the group you most often want was the one you had to go looking for. Each band now carries a sticky
TOP offset of the bands above it and a sticky BOTTOM offset of the bands below it, so passed groups
stack at the top and coming groups stack at the bottom, all legible and all clickable (the band is
its group's toggle). The offsets are
`top:calc(var(--bi) * var(--bh));bottom:calc((var(--bn) - 1 - var(--bi)) * var(--bh))`, where `--bh`
is the band height (30px, keep it in step with the band's padding and type size) and `--bi` / `--bn`
are the band's index and the RENDERED band count, set as inline custom properties by `renderSlate`.
They are passed rather than hardcoded per class because an absent group must not hold room: with only
Ready to play and Complete today on the board, the green band pins flush to the bottom edge. Add a
band by adding it to the `bandSpec` array, which is filtered to non-empty groups and then indexed, so
the offsets stay correct on their own.

## Direction B finished: the stats drawer, the Loft and Featured (owner-approved 2026-08-10)

The three elements that were still on the pre-direction-B look. Mock-ups of the options considered
live at `home-rails-mockups.html` in the repo root; the owner picked B2 / B2 + B1 / B2.

**The shared vocabulary, now used by every element on the home surface.** A solid saturated ground,
a 4px left rule where an icon used to be, a small uppercase eyebrow over a big 800-weight name, one
control on the right edge, and BANDS rather than nested borders. Two things are now banned outright
on this surface: **pastel tinted icon squares** and **chevrons**. One label spec everywhere, 11.5px
/ .13em / 800 / uppercase, and NO `DM Mono` and no `--muted`, both of which are dead magazine-theme
tokens that survived only in the desktop drawer.

**1. The expanded game stats drawer (`app/DailyTilePanel.jsx`), DESKTOP ONLY.** The phone drawer
reached this direction first (2026-08-07) and the owner's call was to leave it exactly as it is, so
**every rule added in this pass sits in a `min-width:901px` block appended at the END of that
component's stylesheet, and nothing above it was edited.** Verify that when touching this file: the
`@media(max-width:900px)` block must stay byte-identical or the phone drawer has been changed by
accident. What desktop gained: the SLAB (a cap bar carrying the one-line answer to "how am I doing
at this game", which also takes Play, so the header keeps only Close); one border around the grid
with a navy band per column instead of three bordered cards holding bordered tiles; the 2x2 stat
tiles dropped, since the slab says all four; the history chart moved INTO the record column (it is
the best object in the panel and it sat below the fold, and in the column it also absorbs the height
the six-week calendar sets); gold/silver/bronze rank numerals matching the rails; and the calendar
moved onto the blue ramp, because a green/red month read as a traffic light next to a page that
retired that palette in August 2026.

- `.dtp-trend` is now the FOURTH child of `.dtp-grid` rather than a sibling of it. The phone's
  `display:contents` promotion still works unchanged, but a **crowd game** (outwit / outrank / feud)
  needs the full panel width for its prompt cards, so `.dtp-grid` takes a `cw` class on those three
  and the strip spans all columns exactly as before.
- 901-980px is a real tier: two columns from the existing `max-width:980px` block plus the bands
  from the new one. It has its own small block; do not collapse it.

**2. The Loft (`app/HomeRails.jsx`).** Each face leads with its own cap slab (`.hr-lslab`), which
also carries that face's headline figures, so the old `.hr-stats` strip is gone from this panel.

- **THE LIVE FEED SLAB IS ANONYMOUS, and must stay that way (owner rule, 2026-08-10).** It shows the
  DAY'S TOTALS, plays and time played, never the newest player's name or score. The rows below carry
  results without attribution; promoting one person's run into a headline is a different product.
- Mastery is banded **Nearly there / Done / Not started**, closest-to-done first. Sorted purely by
  percentage the face opened on the games you had already finished, which is the least actionable
  ordering a progress board can have. Bands are the slate's own band object and are sticky, since
  the Not started band runs to 40-odd rows.
- Mastery bars are coloured by the game's slate category (`catBlue`), so a 50-row column reads by
  category as well as progress. One blue at that length was a field of grey.
- The feed's 32px conic rings became the 4px left rule (`.hr-rl`), still coloured by `ringBlue`, with
  the percentage as plain text on the right edge. Fourteen rings stacked in a 300px rail were the
  busiest object on the page.

**3. Featured (`app/HomeRails.jsx` + the `featured` prop in `app/quizzes/QuizHomeClient.jsx`).**
Three equal pastel rows became three cap cards stepping navy / blue / pale down the ramp, each with
a real control instead of a chevron. The leading card carries the gold rule that marks the day's
event. The header carries a **resets-in chip** counting down to Eastern midnight, computed in an
effect and never during render (it reads the clock, so a server-rendered value would hydrate
against a different one, the same reason `contestIsLive` and `isSundayET` are deferred).

The prop shape is `{ eyebrow, name, sub, leader, href, cta }`, with fallbacks onto the older
`{ title, sub }` so an un-updated caller still renders. `icon` / `color` / `tint` are gone with the
row that used them.

## The gate's Start button sits at the RIGHT edge, on one row (owner rule, 2026-09-01)

Most of a daily is played with a thumb, and the thumb rests at the right. So the
pre-start card's action block is ONE flex row, not a stack: the primary CTA
(Start, Dive, Open the bracket, Start the inquest, whatever that game calls it)
at the RIGHT edge, and the instructions toggle at the LEFT.

```jsx
<div style={{ marginTop: 18, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
  <button className="xx-btn" onClick={startGame} ...>Start</button>
  <div>
    <button type="button" onClick={() => setGateRules((v) => !v)} ...>
      {gateRules ? 'Hide detailed instructions' : 'Show detailed instructions'}
    </button>
  </div>
</div>
```

- **`row-reverse` rather than reordering the JSX**, so the CTA stays FIRST in the
  DOM and therefore first in tab order. It is the primary action; a keyboard
  player should reach it before the instructions link.
- **`space-between` + `flexWrap: 'wrap'`** means a narrow phone degrades to two
  right-aligned lines rather than overflowing. With one child (a returning player
  whose toggle is hidden, or a gate showing the rules already) the lone CTA still
  lands at the right, because `row-reverse` puts main-start at the right edge.
- **The toggle's own `marginTop: 10` / `marginLeft: 8` comes OFF.** Those spaced a
  stack; in a centred flex row they only misalign it. The `gap` does the spacing.
- Same treatment on both gate shapes: the wrapper variants
  (`marginTop: 18` and `marginTop: 'auto', paddingTop: 18`), and the loose
  primary + "Show instructions" pair used by anon, docket, redact, strata and
  suffice, which gained the wrapper it never had.
- Applied 2026-09-01 across all 79 daily clients that carry a gate. Circa is the
  one game deliberately untouched: its Start is a full-width button inside the
  board, so it already reaches the right edge.
- **A new daily game builds its gate this way from the start.**

## A TAP MUST NEVER COST, AND EVERY DRAG OWES AN EXIT (owner rule, 2026-09-01)

Reader report on Plot: "When you accidentally press on a square there should be a way of
deselecting what you have selected without it counting as an error." Two holes, and both
generalize to every drag-to-claim daily.

- **The degenerate case of a drag is a TAP, and a tap must be free.** Plot's `claim()` let a
  1x1 release off only when the cell held no clue, so tapping a NUMBERED square was read as
  "one cell offered against a 5" and cost an error. The board's own gesture vocabulary already
  said otherwise: tapping a claimed plot HANDS IT BACK, for nothing. A tap and a claim were the
  same event on half the board. The rule now: a 1x1 release costs nothing unless it is a real
  claim that cannot be a mistake (on Plot, a 1 on its own cell, correct by construction).
- **A drag in progress needs a visible way out that is not "finish it and undo".** The pointer
  is CAPTURED, so the grid keeps receiving moves once the finger leaves it: mark the drag `off`
  rather than ignoring those moves, ghost the preview while the finger is outside so the cancel
  is visible BEFORE release, and throw the drag away on a release out there. Escape does the
  same on desktop. Say so in the rules copy, the under-board line and the SEO prose, per the
  copy rule above.

**Verify without spending the owner's daily.** `postResult` fires on a win or a reveal, and
`useAbandonFlush` files a row only when the player has `acted` (a claim, an error, or a hint).
So on an ARCHIVE board (`?p=N`, then its "Replay, unscored" control) a test that claims nothing
and errors nothing leaves NO row at all: the fix working is exactly the condition for leaving no
trace, and the fix failing files the row that tells you. Drive it with synthetic `PointerEvent`s
dispatched on the grid element (React listens at the root, so they bubble; `setPointerCapture`
throws on a synthetic pointerId and is already inside a try/catch). Claim the 1 and tap it back
to prove the positive branch still works and to return `acted` to false.

## SVG PAINT IS THE CONTRAST SWEEP'S DEEPEST BLIND SPOT (owner rule, 2026-09-01)

Two reader reports on the same day were the same bug one layer below the one
`ungrounded dark ink` already documented. Ink that is an **SVG paint** is invisible to every
`color:` grep AND to `verify-stage-contrast.mjs`, which pairs ink with a background on the same
line and so cannot see text that paints no ground of its own.

- **Hedge:** "I only have two 0s on the board. No other numbers at all." All 27 clues were
  rendering. `<text fill={col}>` with `col = k > c ? rust : k === c ? '#c3c8d4' : COLORS.ink`,
  laid straight on the board, so every UNSATISFIED clue was near-black on near-black. The 0s
  showed because a 0 is satisfied from the first render and took the dim branch.
- **Etch:** a solved day's gallery thumbnail was `<path fill={p.sunday ? accent : COLORS.ink}>`
  on a `--stg-surf` card, so only the Sunday pictures could be seen.

**The diagnostic: when only the DONE state of something is visible, the live state is painting
ink.** The fix is not a var in the attribute, since a presentation attribute cannot read a
custom property, but `fill="currentColor"` with `style={{ color: 'var(--stg-ink, <orig>)' }}`, the
same route Jester's crowns took. Verify by injecting a probe node on the live page and reading
`getComputedStyle(el).fill`: it must come back as the token colour, not the fallback. To sweep,
`git grep 'fill={' -- 'app/*/*Client.jsx'` and read each ternary by hand (about thirty sites,
most of them meaning colours: chess pieces, terrain, region hues). No checker can do this one,
because the value is a variable.

## A DROP ZONE IS A CELL, NOT A CARD (owner rule, 2026-09-01)

Reader report on Venn: "In dark mode, once you have put the words into the Venn diagram, you
then can't see the words as they are light font on a light background." `.vn-zone` was a
hardcoded `rgba(255,255,255,0.92)` box, while the filed word inside it HAD been converted, to a
translucent `--stg-surf` carrying `--stg-ink`. The converted half made it worse: near-white text
on a translucent white over a hardcoded white, 1.1:1.

**A drop zone, a tray slot, a target region: these are shapes you must see the EDGES of before
anything is in them, so they take `--stg-cell` / `--stg-cell-line`, never `--stg-surf`**, which
is a card's lift and belongs to shapes you read the CONTENTS of. Full / over-full states signal
with their BORDER, a UI boundary owing 3:1, so they take `--stg-good` / `--stg-bad` rather than
the 700-weight green and rust chosen against paper; a "ready" FILL is
`color-mix(... var(--stg-good) 22%, var(--stg-cell))` so it stays a tinted well in either
register instead of a pale wash on a dark board. After: 12.69:1 dark, 19.43:1 light.

Note that the same file had already solved this for its three circle hues and still missed the
box underneath them. **Converting the meaning colours is not evidence the surfaces were done.**

## A DAILY THAT PAINTS CELLS COMMITS ON LIFT, NOT ON TOUCH (owner rule, 2026-08-24)

Etch's squares are 12 to 25px on a 390px phone against Apple's 44px minimum touch target, and its
Fill tool scored the error on `pointerdown`. So a fingertip that covered four squares and landed on
the wrong one cost a point, permanently: Undo restores the square but never decrements `errors`. The
feedback was "my fingers are too fat for etch", and measuring it showed that even the easiest board
of the week sits at 57% of the minimum target, with Sunday at 27%.

**The rule: on a TOUCH pointer a stroke is a PREVIEW until the finger lifts, and nothing is scored
before the lift.** Mouse is deliberately untouched, since a cursor is one pixel wide and needs no
aiming. Three mechanics, and a game that paints cells needs all three:

1. **Commit on lift.** pointerdown starts a pending stroke that RENDERS but does not write. The whole
   stroke lands in ONE write on pointerup, with errors counted there and nowhere else, so a square
   you preview and slide away from was never filled and never scored. One undo entry per stroke.
2. **Press and hold to aim.** Hold still for `AIM_HOLD_MS` and the target square starts FOLLOWING the
   finger, re-deriving its action from whatever square it is now over (sliding onto a filled square
   offers to clear it). Move more than `AIM_SLOP_PX` first and it is a sweep instead, so a quick drag
   to fill a run is never caught in aim mode. Aim and drag are the same gesture at small distances,
   and a dwell is the only honest discriminator between them.
3. **A callout ABOVE the finger**, naming the square (R4 · C7) and what will happen when it lifts. A
   fingertip hides the square it is on, so a preview drawn only under it is feedback nobody can see.

**Do NOT answer a fat-finger complaint by forgiving the mistake.** Letting Undo take back an error,
or not counting a fill that is cleared within a few seconds, turns Etch into free probing: tap every
square, keep the ones that stay black, and score a clean 10 with no logic at all. Where errors ARE
the score, the only honest fixes make the target bigger or make the tap correctable BEFORE it
commits. Both of those are what this section is.

**The callout's POSITION is not React state.** A 20x20 board is ~540 divs, and re-rendering them on
every pointermove is jank a phone cannot afford, so the position is written straight to the node and
a render happens only when the target SQUARE changes. `sameCells` guards the sweep path for the same
reason. Any future preview that follows a finger needs the same treatment.

**Touch drags are LINE LOCKED** (`runBetween`), running along the row or the column the finger has
travelled further in, ties going to the row. A free-form path smears diagonally across squares
nobody aimed at, which is the same fat-finger problem wearing a different hat. The mouse path stays
free-form.

### The phone board takes its width back

Measured on a 390px phone, before and after: squares went 23.2 -> 28.4 (10x10), 15.5 -> 18.7 (15x15)
and 12.0 -> 14.3 (20x20), about a fifth wider at every size, from two changes and no redesign. Under
560px the board card and the Etch-scoped `.loft-stage` give up their horizontal padding, and the
CLUE GUTTER narrows below the width of a playing square.

**The gutter ratio is size-aware and was MEASURED, not guessed** (`gutFor`). The clue font shrinks
more slowly than the board grows, so a single ratio that suits 10x10 clips 20x20: in DM Mono at the
sizes `clueFs` actually renders, a two-digit clue is 10.8 / 8.4 / 7.2px against gutters of 18.7 /
13.1 / 10.6px, and a first cut at a flat 0.66 clipped the Sunday board by 0.6px. Two digits is the
widest clue any board carries (a run of 20 on a Sunday). Re-measure against the REAL computed font
before narrowing any of these, and note that the desktop values are untouched: the phone template
rides its own `--et-cols-m` / `--et-rows-m` / `--et-ar-m` custom properties, because `fr` cannot be
computed inside `calc()`.

**Verifying this without a phone.** The handlers are testable off the page: brace-match them out of
the client (the trick `verify-endgame-playout.mjs` uses), stub `document.elementFromPoint` over a
grid of known coordinates, and drive synthetic pointer sequences. That is how commit-on-lift, the
hold-to-aim discriminator, the line lock, the free marks, the win path and the unchanged mouse path
were all confirmed before the push, along with a unit test of the commit's error arithmetic.

## The Loft: live feed + daily category leaders, and where mastery went (owner, 2026-08-12)

The right rail's Loft (`app/HomeRails.jsx`) has TWO faces, and the second one sub-rotates.

- **Face 1, Live feed.** Its slab is still deliberately ANONYMOUS (day totals, never the newest
  player) and now carries THREE figures: plays as the hero number, then **players** and time played
  as a small stacked pair (`.hr-lspair`). `todayPlayers` is distinct players today across every
  puzzle and quiz, GUESTS INCLUDED, keyed `u:<user_id>` or `a:<anon_id>`, computed in the loop
  `/api/quiz/totals` already runs, so it costs nothing. ⚠️ `setTotals` in `QuizHomeClient.jsx` is a
  FIELD WHITELIST, not a spread: a new field on that endpoint must be added there AND to the
  `useState` default or it silently arrives undefined (todayPlayers rendered "0 players" for one
  deploy for exactly this reason).
- **Face 2, Daily category leaders.** The leader of a daily-game category is the player with the
  MOST COMBINED POINTS across every game in it today, the same currency the combined daily board
  runs on, so sweeping a category beats one big run. Derived client-side from `dailyBoard.games`
  (the per-game boards the page already fetches), so no new route. Known limit, accepted: each
  per-game board carries its top 10 NAMED players, so a player outside every game's top 10 is
  invisible, which cannot cost anyone a category lead in practice.
- **ALL NINE CATEGORIES ARE ON THE ONE FACE, and the face WATERFALLS.** It shipped as three slips a
  view and then five, and both were the same mistake at different sizes: splitting the categories
  across turns meant waiting out a rotation to see one that simply was not on this turn, and slips
  that grew to fill the panel came out ~190px each when a view held two. The face is a SCROLLER of
  nine equal slips now, and what changes between turns is the ORDER: each time it comes back the
  list rotates by one, so every category takes its turn on top without anyone scrolling. The flip is
  a plain two steps again.
  - `spin` advances when the face turns AWAY from the leaders, not towards them, so the first turn
    shows the natural order and the shuffle starts on the second. The scroller is KEYED on `spin` so
    a new turn remounts it; without that it kept the last turn's scroll position and the freshly
    promoted category opened off the top of its own view.
  - The category list is built from the STATIC roster (`liveDailyKeys()` first-appearance order, the
    same order the slate's filter strip uses), never from today's board.
- **Each leader is a hero slip**, and a slip IS `.hr-lslab`, the same object the live slab is, at its
  natural 85px with `flex:none`. So the FIRST slip stands in for the panel's slab and the Loft still
  starts on the same line as the console's Up next bar; there is no separate slab on this face.
  Grounds step navy / blue / pale (`.hr-cls.c0/.c1/.c2`) keyed on the CATEGORY's index, never its
  position: position-based tones made every slip change colour every eight seconds, which read as the
  panel redrawing itself rather than reordering. The left rule takes the category's own colour from
  `lib/home-blues`. A category with no plays yet renders "Nobody yet" rather than dropping out, so
  the rotation can never land on a hole.
- **Pill labels are checked against the RENDERED header, not read on their own.** The header is one
  row of a 282px rail and its title must never wrap, so "Category leaders" cut the panel title down
  to "THE L...". It reads "Leaders".

**DAILY MASTERY LEFT THE LOFT** for the Category Mastery tile on the browse row
(`CategoryMasteryTile` in `app/quizzes/QuizHomeClient.jsx`), which now flips between two faces on the
same 8s beat: **Quiz Mastery** (the old "Category Mastery", share of each category's quizzes played)
and **Daily Mastery** (share of each daily game's archive played, from `fetchDayStatus().archive`).
A daily row is a LINK to its game; a quiz row is a button that filters the feed, as before. Either
face can be empty on its own and simply is not one of the flip's stops; the tile only disappears when
both are. Daily rows are ordered **under way, then done, then untouched** rather than by percentage,
the same rule the Loft's banded version followed, and it matters more here because the tile shows
eight rows out of fifty-odd: sorted by percentage it would open on the games already finished.

## Feedback forms prefill a signed-in player's reply address (2026-08-02)

Every "Report an issue" / "Comments? Critique?" form asks for an optional name
and email, and most reports arrived with neither, so a good report could not be
answered. All of them now prefill from the identity the client already stores
(`sot_quiz_identity`), read through `lib/saved-identity.js` (`savedIdentity()`,
SSR-safe, returns empty strings off-window). Wired into `app/ReportIssue.jsx`,
the list pages (`DetailClient`, `ListOverview`), `QuizHomeClient`, and all
twelve quiz boards that carry a critique modal. The fields stay editable and
still optional (a guest sees empty fields exactly as before), and the prefill
uses `setX((v) => v || who.x)` so it never overwrites something already typed.
Any NEW form that collects reader feedback should do the same.

## The A-to-Z / Reorder bar sits at the FOOT for a new phone visitor (owner, 2026-09-02)

On `/today` (`app/today/StageToday.jsx`) the `.sty-ord` bar (A to Z, Reorder categories, Reset)
renders ONCE, from the `ordBar` const, in one of two places: at the top of the sections, or under
the last category row when `ordBelow` is true. `ordBelow = narrow && returning === false`, where
`narrow` is the page's existing `<=640px` flag and `returning` is the WelcomeOverlay footprint test
(saved identity, any `sot_<key>_day` breadcrumb, any per-puzzle save; storage unreadable counts as
returning). The reasoning: those two controls rearrange a page a first-time reader has not read
yet, and on a phone they took the first line under the cap. A returning or registered reader keeps
them at the top. `returning` is null until its effect runs, so the server and the first client paint
agree (bar at the top) and only a new phone visitor sees it drop, once. Desktop is unchanged for
everyone. Do not add a second copy of the bar's JSX; render `ordBar`.

## Your standing: the home answers "how did I finish in each game" (owner, 2026-09-01)

`/today` (`app/today/StageToday.jsx`) could not answer the one question a player
asks after a few games. A card said `done` and the ladder lit a rung, both
binary; `#sty-board` reports the COMBINED day. Where you came in Crux was nowhere
on the page.

- **`#sty-standing` PAIRS WITH THE BOARD** (`.sty-pair.sty-trio`, areas
  `'st bd' 'lv lv'` above 900px). They answer the same question from opposite
  ends, how did I do and how did everyone do, so they share a row; the FEED,
  which is a list rather than a table, takes the full width underneath where its
  rows tile instead of running single file down a half. With no standing the
  trio class is absent and the layout falls back to the old board-and-feed pair
  off the SAME DOM order. Sorted BEST FIRST (points, then rank, then name).
- **The standing scrolls to the board's MEASURED height.** Sixteen rows beside
  eleven left the section ragged, and a row-count guess is wrong on a small
  field, which genuinely renders fewer than ten. A ResizeObserver on
  `#sty-board` publishes `--sty-lbh` and `.sty-sscroll` takes it less its own
  heading. No feedback loop: the pair is `align-items:start`, so the standing's
  height never moves the board's. **Below 900px there is no scroller at all** — a
  scrolling panel inside a scrolling page is the worst thing a phone can be
  handed. The observer's dep is `!!myOut`, not `myOut`: the object is rebuilt
  every render and passing it tore the observer down and rebuilt it each pass.
- **The run is ONE column**, `gameStats(row, game.miss)` — `4/10 · 3 busts ·
  2:11`. See rule 4 above for why it is not three columns with a shared header.
- **NO POINTS COLUMN** (owner, 2026-09-01). The board beside it IS the points
  table; this one is for the run, and the rank carries how it placed.
- **A played GAME CARD swaps its tagline for its result** (`.sty-gres`): the tag
  says what the game IS, which is what a reader needs before they play it and
  nothing they need after. It reads **`You: #3 of 10`** — the label because a
  bare `#3` on a card in a grid of cards reads as something about the game
  rather than about the reader, and NO SCORE, because the rank already answers
  what the card is being asked (owner, 2026-09-01).
- **A FINISHED circuit card reports its standing in place of its blurb**, and
  only a finished one: the combined board refuses to rank a player who has not
  played every game of a skill circuit (`rankRequiresAll`), so a part-done
  circuit has no honest figure, and a finished one is exactly when the reader
  has already read the blurb. One `daily-combined?circuit=<id>` request per
  finished circuit, asked once through a REF rather than state so the effect
  cannot chase its own writes, capped at four.
- **PLAYED GOES TO THE END OF EVERY SECTION** (`playedLast`, a stable two-way
  partition). A row is a list of what to play and the played ones are a record;
  sitting mid-row they made the reader skip past this morning to find this
  afternoon. Applied to My games, A-to-Z and every category row; circuits
  already sorted finished last.
- **The feed's wide panel is WIDE-ONLY and renders nothing under 1100px**, where
  the feed is exactly what it was. Above it, the half-screen the full-width feed
  was wasting carries the day's plays drawn by category in the nine ramp steps
  (from `totals.todayByQuiz`, whose quizIds carry their game keys), the reader's
  share of the day's plays and time as two meters, and what their finished games
  add up to. Every figure is a count of something already on the page.
- **`.sty-g.done` wears `opacity:.42`, and opacity on a parent cannot be undone
  by a child**, so a rank printed inside one lands near 2:1 whatever colour it is
  given. A card that has something to say therefore states "played" in COLOUR
  instead (`.sty-g.done.res`: name steps to `--stg-mute`, which clears 4.5:1 on
  both registers, and the figures keep their own). This is the same trap the
  contrast sweeps keep finding; never dim a surface that has to carry a figure.
- **It costs NO REQUEST.** `daily-combined` is already fetched for the board
  above and its `me.perGame` is keyed by every game the reader scored today. The
  rank on it is the registered-only board rank the route already substitutes, so
  this cannot disagree with a game's own board about where you came.
- **AN UNFINISHED GAME HAS NO STANDING, and the test is POSITIVE EVIDENCE of a
  finish** (owner, 2026-09-01, the day after this shipped). An abandoned row is
  a started-and-left run: it is filed, and per the standing abandon-equals-count
  rule it does score, so it reached `me.perGame` carrying a real rank and the
  home printed "You: #12 of 30" on the card and a ranked row in this table for a
  game the reader walked out of. ONE FILTER in the `standing` memo fixes all
  three surfaces, because the card reads `standBy` off that same memo and the
  eyebrow counts its length. It takes TWO SIGNALS, because neither covers both
  readers: `abandoned` travels on the row and is exact for a REGISTERED player
  (a real finish supersedes an earlier abandon in `combineDaily`, so it is true
  only when they never finished), while a GUEST's perGame comes from
  `guestProvisional`, which carries rank and field and nothing else, so their
  test is the local `done` set, which daily-status builds from the same
  never-finished definition and which crosses devices. Written as
  `r.abandoned === false || (statusIn && done.has(key))` rather than as the
  absence of a flag, so an undefined flag WAITS for the status instead of
  reading as a finish: the negative form let a guest's row appear ranked and
  then vanish when the status landed a moment later. `statusIn` is a separate
  flag because an empty `done` means "nothing finished" once the answer is in
  and "we do not know yet" before it, and only the answer can tell them apart.
- The cap gains a fourth `sty-cx` anchor, FIRST of the three, drawn only when
  there is a day to show so it never points at a section that is not there.
  Retired games are filtered out, since an archived day still scores. **The
  phone cap is a GRID WITH NAMED AREAS**, so a new control needs an area or
  auto-placement drops it into the figures row, where a bordered icon among four
  text figures reads as a fifth figure that lost its label. It is five columns
  now: `'id st lb lf tg' 'fg fg fg fg fg'`.
- **EVERY DATA-FED SECTION FADES IN AS ITS PAYLOAD LANDS** (owner, 2026-09-01:
  "it just appears piecemeal"). The page is fed by four separate requests, day
  status, the combined board, totals and the feed, and each section they fill
  used to snap into place whenever its request happened to answer, which read as
  the page assembling itself in pieces rather than arriving. FADE ONLY, no
  skeletons: the owner chose the cheap treatment over reserving each section's
  height, so the page still moves as sections arrive, it just no longer snaps.
  - **It is a CSS animation off the MOUNT, with no state and no effect.** Every
    one of these sections is rendered only once it has something to say, so it
    mounts at the moment its data lands and `.sty-rev` plays once, on its own.
    Anything that needs to keep an animation in step with a fetch by hand is
    doing it the hard way; render the section conditionally instead.
  - **OPACITY AND A 6px RISE, never height and never scale.** `#sty-board` is
    measured by a ResizeObserver that feeds the standing's height, and a
    ResizeObserver watches BOX SIZE, which a translate does not change and a
    scale does. A skeleton or a height animation on that section would have made
    the pair jitter.
  - Rows stagger off an `--i` index (`.sty-revr`), capped at nine steps so a
    long standing never keeps the reader waiting on its last row. React writes a
    numeric custom property verbatim, so `style={{ '--i': i }}` is safe.
  - **NO APOSTROPHES in the CSS**, per the standing rule: the stylesheet is a
    text child of a `<style>` element, so React escapes them.
  - ⚠️ **IT IS ARMED ONLY WHEN THE DOCUMENT IS VISIBLE AT MOUNT**, via a
    `data-sty-anim` attribute the component puts on the root element, and that
    gate is not decoration. A browser DOES NOT ADVANCE AN ANIMATION CLOCK IN A
    HIDDEN TAB, so a page loaded in the background holds every one of these
    sections at its FROM state, opacity 0, with `playState` still reading
    "running" and `currentTime` still 0, for as long as the tab stays in the
    background. For a reader that is self-healing and arguably ideal, the fade
    plays the moment they look at the tab. For everything else that reads a
    page it is not: BOTH browser harnesses available in a Cowork session report
    `document.visibilityState === "hidden"`, so the live home came back blank
    from every automated check, which in a repo whose first rule is to verify on
    the live site is a defect in itself. Unarmed, the rules do not match and the
    content simply renders. Deliberately NOT re-armed on a later
    `visibilitychange`: fading in a section that has sat in the DOM for a minute
    is worse than not fading it. **Any future entrance animation on any surface
    here needs the same gate**, and the tell that it is missing is a page that
    reads blank to automation but looks right by hand.
- ⚠️ **The three cap anchors do not scroll this page under automation**, and a
  handler that calls `preventDefault` and then fails to scroll is strictly worse
  than a plain anchor, so one was written, measured, and REVERTED on 2026-09-01.
  Every measurement came through the browser harness, which then froze the
  renderer twice, so whether a real reader's click works is still unestablished.
  Establish that FIRST, by hand, before writing another handler.

## Palette: MIDNIGHT (shipped 2026-08-21)

Same blue, much darker ground. `lib/theme.js` and the `:root` block in `app/globals.css` are the
palette; `scripts/check-theme.mjs` asserts the two agree. The whole diff from the previous navy:

```
ground  #14264f -> #0b0f1a      accent / blueDark  #1e3a8a -> #233a63
blue/cta #2563eb -> #2f6fe4     blueDeep/ctaHover  #1d4ed8 -> #2563eb
ink     #0b0c0e -> #0b0d12
```

**Sixteen of the twenty-seven tokens did not move.** Every light neutral, the pale blue ramp,
success, successDeep, danger, gold, silver and bronze are byte-identical to before. That is the
point of the direction rather than an accident of it.

### Why this one, after two failed attempts at something warmer

Two warm palettes were built and pulled the same day. The failure is worth keeping because it is
a rule, not a mishap: **a brand colour may not sit in a hue band that already carries game state.**
Measured off the live code, the occupied bands are

| Hue | Meaning |
|---|---|
| 0-30° | wrong / failed |
| 30-60° | partial / near-miss / unfinished / medals |
| 135-165° | correct / solved |
| 330-360° | streak |

Coral sits at hue 9°, inside the busiest of them, so a primary button and a wrong answer were the
same colour separated only by how dark they were. Moving `danger` out to `#8f1d24` was tried first
and did not help, because the problem is the CATEGORY, not the distance. The only hue regions
genuinely free of state meaning are 240-300° (indigo / violet / plum) and, weakly, 180-210°.
Midnight sidesteps the question entirely by adding no hue at all.

### Two things a future palette change must know

**1. A token swap is NOT a recolour, and `PENDING = []` does not mean what it says.**
`check-theme.mjs` declares every tree under `app/` converted and guarded, and it has been FAILING
the whole time with ~300 raw brand hexes it inherited. Run it and read the number before planning
anything: a green guard means the change is two files, a red one means a codemod. This change was
52 files on top of the tokens.

**2. There is a second hiding place the guard cannot see at all.** The header, console bands,
category strip and rails are painted with hand-picked navies that were never tokens: `#2c4fa8`,
`#2c437c`, `#16307a`, `#12276b`, `#1c46a8` and about twenty more, 56 occurrences. `check-theme`
builds its `HEXES` set from the token table, so **anything not in that table is invisible to every
check in the repo**. During the coral attempt these were what kept the header navy after the tokens
had already changed, and they needed a whole second pass. `midnight.mjs` handles them with a
darkening transform over an explicit file list.

### The traps in the codemod itself, all of which fired

- **The map is a CHAIN.** `#2563eb -> #2f6fe4` and `#1d4ed8 -> #2563eb`. Applied as sequential
  replaces, `#1d4ed8` lands on `#2f6fe4` via two hops. One regex pass with a lookup is what makes
  it safe; do not "simplify" that.
- **Part 2 must not re-darken part 1's output.** The first run printed `#233a63 -> #142239`: the
  brand-new accent, darkened a second time into a colour nobody approved. `darken()` now refuses
  any value in the token table.
- **The darkening gate needs a LIGHTNESS CEILING, not just hue and saturation.** `#dbe6ff` and
  `#bfd0ee` are text and accents sitting ON the dark chrome; pulling them down destroys their
  contrast against it. Only `L <= 0.50` moves. The hue floor is 210 rather than 205, which spares
  `#2f6f9f`, the school/sports DEPARTMENT colour.
- **The CTA is constrained by the ink it is paired with, not by taste.** `T.cta` sits beside
  `T.white` at roughly 80 call sites and beside `T.ctaInk` at 22. `#3b82f6` is 3.68:1 against white
  and would fail all 80; `#2f6fe4` is 4.65:1. Check that pairing ratio BEFORE choosing a value.
- **Verify by proof, not by reading the diff.** The gate here: strip every hex and rgb triplet from
  before and after and assert the residue is byte-identical per file; assert the state colours and
  light neutrals are unchanged COUNT FOR COUNT; assert the old values are gone and the chained ones
  are conserved; re-parse every changed `.js`/`.jsx` with acorn + acorn-jsx (both already in
  `node_modules`; there is no esbuild binary in the sandbox).
- **Two of the first verifier's own checks were wrong**, which is its own lesson. "No old value
  survives" is undecidable for a chained map, since `#2563eb` is both an old key and a new value;
  and "nothing `darken()` would touch remains" is impossible, because darkening is not idempotent
  and its own output is still a dark navy. Both were replaced with conservation counts and an
  explicit before-set.

### THE DAILY PAGES PAINT THEMSELVES WITH `accent`, NOT `ground` (found 2026-08-21, same day)

Midnight shipped and the daily puzzle pages did not change. `.loft-page` and `.loft-stage` in
`app/LoftCap.jsx` both set `var(--accent)`, while the quiz home sets `C.ground` on `.qzloft`.
**There are two different "dark page ground" surfaces on this site and only one of them is
`--ground`.** Before Midnight it was invisible, because accent `#1e3a8a` and ground `#14264f`
were both mid navies; the moment ground went near-black the homepage went dark and 65 game
pages stayed exactly as they were.

The symptom that made it obvious was the HEADER. `.qchm-r1`, the header bar on a game page, is
also `accent`, so bar and page were **the identical colour, 1.00:1**, and the header buttons
floated on an undifferentiated navy field. Pointing `.loft-page` and `.loft-stage` at
`var(--ground)` restores the relationship the homepage already had: 1.69:1, and the bar reads
as an object again.

**Check both surfaces on any future palette change.** Grep for `loft-page`, `loft-stage` and
`qzloft` and confirm all three moved. A palette that only lands on `--ground` lands on the
homepage and nothing else.

### `blue` AND `cta` ARE THE SAME VALUE, AND ONLY ONE OF THEM SHOULD EVER BRIGHTEN

Midnight brightened the CTA to `#2f6fe4`. Because `blue` and `cta` held the same `#2563eb`,
the literal codemod dragged the entire ramp with it, and **`blue` is not only a button
colour**: `.lcap` (the per-game masthead band), `.dh-cell`, `.cb-card.up` and
`.dtp-cell.played` all use it as a large SURFACE. The result was a bright blue bar across the
top of all 65 puzzles.

The rule: **a CTA change belongs to the `cta` TOKEN alone and must never be pushed into
literals.** The follow-up reverted the blue ramp in 39 files (`#2f6fe4 -> #2563eb`,
`#2563eb -> #1d4ed8`, one pass, chained again) and left `cta` bright in the token table, so the
only thing that got brighter is a button. Before touching `cta`, grep for
`background:var(--blue)` and see how much of it is a surface.

### Outstanding

1. **`check-theme.mjs` is still red** (299 raw hexes). This change neither worsened nor paid down
   that debt. Paying it down means converting those literals to `T.*` / `var(--*)`.
2. **Its token regex misses `blue400` and `blue200`** (`([a-zA-Z]+):` does not match a digit), so
   those two are unverified by parity on both sides. Consistent, so no false failure, but not
   covered.
3. **The blue game-tile art still matches**, since the hue did not change. Any future hue change
   needs ~65 PNGs under `/games/blue/` redrawn, and `tileFallback` silently swaps a missing file
   for the full-colour original, so a half-done redraw shows as one garish tile and no error.

## The game's stats, archive and leaderboards live on the GAME PAGE (owner, 2026-08-24)

The record / archive / leaderboard panel used to be reachable from ONE place: you expanded a puzzle
tile on the home board and `DailyTilePanel` opened as a drawer under it. The marquee home retired
that gesture, and the content was in the wrong place to begin with, since the person who wants a
game's archive and standings is the person playing it. It now sits at the foot of every daily page
behind one control, **"See stats, archive, leaderboard, and more"**.

**`app/GamePanel.jsx` is that control plus the panel, and it renders the SAME component.** It mounts
`DailyTilePanel` rather than reimplementing it, so the phone accordion, the desktop slab, the six-row
calendar, the history chart and the crowd-answer spoiler gate all carry over untouched. Do not write
a second version of that panel; a copy would drift within a week.

- **It replaced "Show overview and more."** That control did one thing: flip the page out of focus
  mode so the tail below the board (Report an issue, the About prose, the footer) came back.
  `GamePanel` still does that, via its `onShow` prop, and then opens the panel. One button, not two.
- **It renders at every stage** — before the start gate, mid-play, and under the finish card — not
  only in focus mode. That is why the mount sits OUTSIDE the `{focusMode && (...)}` guard it replaced.
- **THE BUTTON KEEPS `className="loft-showchrome"` AND MUST STAY IN THE DOM.** This is load-bearing,
  not leftover. `LoftCap` paints every sibling of the play stage in navy body copy with `!important`
  and excludes exactly two wrappers: one holding `.loft-report` and one holding `.loft-showchrome`.
  Drop the class, or unmount the button while the panel is open, and the panel's white card is
  repainted `#bfd0ee` on white and becomes unreadable. That is also why the button toggles to "Hide"
  rather than disappearing.
- **Lazy, and through the shared clients.** Nothing is fetched until the first open. Then two reads:
  `/api/quiz/daily-game` for the archive drops, the all-time board and the viewer's record, and
  `/api/quiz/daily-me` through `fetchDailyMe` for today's board and the viewer's row on it, so it
  joins whatever request the end card or `DailyBoardPanel` already has in flight rather than starting
  another. Mounted on 70 clients, a page nobody opens it on costs one component that renders a button.
- **`self` is the ROUTE name, copied from the `ReportIssue` line beside it**, because the route is not
  always the registry key (`/parker` is `park`, `/jesters` is `jester`). `resolveGame` accepts either
  and resolves through the roster, so nobody has to remember the two exceptions. An unresolvable
  `self` renders nothing at all rather than an empty panel.
- **Both Play controls are hidden** (`.dtp-play`, `.dtp-sgo`): on the game's own page they are
  self-links, so "Play" would reload the page and "Play again" would look like a replay it is not.

**The home board no longer expands anything.** `app/today/TodayClient.jsx` lost the drawer, its
per-game `daily-game` fetch, the `sel` state and the `.tdy-pw` wrapper; a tile's status chip is a
plain label again and the whole tile is a link to the game. `DailyStrip.jsx` (the pre-marquee console,
behind `MARQUEE_HOME`) still carries its own copy of the drawer and was deliberately left alone.

**Mounted by `scripts/patch-game-panel.mjs`**, anchored edits against a copy taken from the SAME fetch
the deploy commit is built on, per the stale-base rule. Every anchor must match EXACTLY ONCE (zero
means origin moved, two means the anchor is too loose and the patch would land twice) and both throw.
A new daily game gets the mount by copying the one line beside its `ReportIssue`; it needs no props
beyond `self`, `name` and `onShow`.

## The daily cap WEARS ITS CATEGORY, and no ink on it may use opacity (owner, 2026-08-26)

`LoftCap` no longer paints `#2b4676`. The band takes the game's category hue from
`lib/home-blues` (`--cc`, set inline so it lands on the first frame), and the play stage
washes itself with the same hue (`--cat-hue` on `document.documentElement`, because
`.loft-stage` is a sibling subtree the cap's own variable cannot reach; removed on unmount).
A daily page now names its category the way the home shelf does, which is the whole point:
you tap Crux under the blue Word band and land on a blue page.

- **The hue is resolved from the ROUTE** (`loftKey(pathname)`), never a new prop, so none of
  the 70 game clients needed an edit and it cannot go stale, exactly like the URL line.
- **The eight sudoku grids come off the sudoku CIRCUIT POOL**, not their registry `cat`. The
  home page pulls them out of Numbers into a Sudoku shelf, so keying off `cat` would paint
  Suds orange here and violet there. Mirror `circuitById('sudoku').keys`, never a hand list.
- **NO OPACITY ON WHITE, anywhere in the cap.** The ten hues clear 4.5:1 against *pure* white
  with no headroom (Word 5.17, Numbers 5.18), so white at .78 lands at 4.0 and fails.
  Hierarchy comes from size and weight. Same ruling as the home category bands.
- **Anything that has to RECEDE darkens the ground instead.** An inset black wash can only
  ADD contrast for white ink, so one value (`rgba(6,10,20,.24)`) is safe on all ten grounds
  (7.4 to 10.4:1). That is the help control and every A-Z chip.
- **Progress is WHITE, not gold.** Gold runs 2.71:1 on Word and 2.72 on Numbers against these
  hues. Gold keeps the Sunday chip, the leader chips and the Resume pill, where it works.
- **The A-Z roster's states are told apart by FILL, never by a second colour.** Green played /
  amber open / red missed was right on one navy ground and wrong on ten coloured ones, and the
  plain white-alpha chip dropped white text to 3.76:1 on Word. Played and missed sink to a
  `.34` black wash at 66% white, unplayed sits at `.20`, and the single game in progress is a
  solid white pill carrying the band's own hue as its ink. Worst case across all ten grounds is
  4.75:1. This is the same ruling that retired gold Resume on the home bands.
- Deliberately unchanged: the masthead above the cap (it is what separates the two bands) and
  the Start / Resume CTA, which is still `--cta` blue on every hue.

Shipped `a13491ef6`, one file. Verified live on crux (blue), suds (violet, which is the circuit
override doing its job) and sweep (umber). Mockup of the four directions considered:
https://claude.ai/code/artifact/005b28bd-6a0a-4e8b-973b-77bdd623cdda

## The BROWSER FAVICON is the Mind Loft mark on every page (owner rule, 2026-08-31)

Thirty daily games each carried their own tab favicon (`/<game>-icons/favicon-32.png`), so
walking the site changed the tab icon on every navigation and nothing in the tab strip said
Mind Loft. Every one of those now points at the site mark, `/icon.png`, the same 512px blue
brain the homepage serves.

- **One line per game, in `metadata.icons.icon`:**
  `icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }]`. A NEW daily game copies
  that line verbatim; never point a game's favicon at its own art.
- **Do NOT "simplify" it by deleting the line.** This is the trap, and the comment block above
  each one says so: Next resolves the root `app/icon.png` file convention only
  `if (!resolvedMetadata.icons)` (`resolve-metadata.js`), so ANY `icons` object on a page,
  even one carrying nothing but `apple`, suppresses the inherited icon. Deleting the `icon`
  key leaves the tab on the 16px `favicon.ico` alone rather than falling back to the mark.
  `/icon.png` (unhashed) is a real route, 200 `image/png`, and it is served
  `max-age=0, must-revalidate`, so the missing build hash costs nothing.
- **The per-game apple-touch icons and `.webmanifest` icons are deliberately UNCHANGED.** A
  game saved to a phone home screen or installed as an app still shows its own artwork; only
  the browser tab is unified. Do not sweep those in "for consistency" without asking.
- **The `/public/<game>-icons/favicon-32.png` files stay in the repo, unreferenced.** Nothing
  serves them, they cost nothing, and reverting a single game is a one-line change.
## LIGHT IS THE DEFAULT REGISTER, and the stored key is what resets it (owner, 2026-09-01)

The site opened dark for a month and spent that month pointing at its own light switch
(a pulsing ring, a first-load flip, then an explicit bubble). The owner's call is that
light is simply what Mind Loft looks like now, and that every reader lands there, not
just the ones with nothing stored.

- **Three places in `lib/stage-theme.js` say "light", and all three have to agree.**
  `readStageTheme()`'s fallback, `useStageTheme()`'s `useState` (the SSR / first-paint
  value), and whatever a future change picks. The `useState` is NOT decoration: the
  server cannot read localStorage, so it renders the DEFAULT and the client hydrates
  against it, and a value that disagrees with the fallback is a hydration mismatch.
- **THE RESET IS A NEW KEY, never a migration script and never a loosened check.** The
  stored preference moved from `sot_theme` to `sot_theme2`, so every browser starts on
  the new default whatever the old key holds, and the old key is left in place unread.
  A stored 'dark' from the dark-first era is mostly an artefact of the register the site
  used to open in, which is why the owner chose to clear it rather than honour it. Any
  future change to the default takes ANOTHER new key: a browser that stamped the current
  one would otherwise be shut out of the change by its own stamp. This is the same rule
  every once-per-browser gate on this site already follows (`sot_theme_intro2`,
  `sot_theme_hinted2`, `sot_theme_pop2`, `sot_welcome_seen`).
- **The pop-up mirrored with it.** `app/ThemePop.jsx` offered light and skipped anyone
  with light stored; it offers DARK and skips anyone with dark stored. Its key went to
  `sot_theme_pop2` for the same reason as above, so "everyone's first visit from here
  forward" actually reaches the browsers that were shown the old one. The bubble's job is
  the middle sentence, which names the control and says where it lives; the button is a
  demonstration, so it points at whichever register the reader is not in.
- **A reader who has explicitly chosen dark still gets one light frame** before the effect
  resolves. That is the same trade a light-preference reader paid in the other direction
  until today, and it is the price of not blocking the first paint on localStorage.
- **Every `.stage-page` root must WRITE `data-stage-theme`.** The token block on
  `.stage-page` is the dark register and `[data-stage-theme='light']` overrides it, so a
  stage page that carries the class, reads every `--stg-*` token, and never writes the
  attribute is pinned DARK forever and no amount of token conversion will move it. That
  was the Stat Hub for its whole life on the stage (fixed the same day): it was fully
  tokenised and still could not leave dark. When a surface "supports both registers but
  only ever shows one", look for the missing attribute before auditing a single colour.
- **A cap that draws the switch registers its class in `SWITCH` in `app/ThemePop.jsx`**
  and makes itself `position:relative`, or the bubble cannot find the glyph to measure
  against. Four caps draw one today: `StageChrome` (every daily), `today/StageToday` (the
  home), `circuits/CircuitFrame`, and `quizzes/hub/StatHubClient`.

## The home's arrival: the Ramp once a day, the Patch on every other wait (owner, 2026-09-01)

**SUPERSEDED 2026-10-16 (owner): the daily arrival is gone.** `app/StageWelcome.jsx` was deleted with its stats
reads (`lastPlayed` left `/api/quiz/daily-status`). In its place `app/EntryDoor.jsx` shows on a reader's first visit and then
ONCE A WEEK to returners (`sot_entry_v1` holds when it last showed; 7 days, `ENTRY_EVERY_MS`, mirrored in
the snapshot gate): the color bands
and the three brand lines once, no stats, then a dark page ("Loft your Mind in the Mind Loft", "What do you want
to sharpen today?") with a tile per category that opens that pane on the home, and a "Proceed to all of today's
puzzles" button. It is ALWAYS DARK; the site default register stays light. Every other visit opens straight
on the home. `?entry=1` previews, `?entry=0` suppresses. The home snapshot stands down while the door is still
to show (the door is fixed inside the live page, which the snapshot hides), and PremierePop, GroupsPop and the
theme pop-up wait on `.ent-door`. The Patch below is unchanged.

**The door's tiles are SKILLS, not categories (owner, 2026-10-16).** See "Skills: the second axis"
below. A tile opens the home pane of the skill's category; it never starts a run.

Three things shipped together (`32a923301`, `19f8cfb7b`); the design study with looping
mockups is https://claude.ai/code/artifact/8d963ed1-c694-46e9-ad92-a70cd4e773f9.

- **`app/StageWelcome.jsx` opens with THE RAMP.** The ten category bands rise in ramp
  order (`CATEGORY_RAMP`, each naming itself in `RAMP_INK`), the ground wipes across at
  ~1.15s, the bands survive as a 6px ladder along the foot that keeps looping for as long
  as the reads take (the hold), the words land at `RAMP_WORDS` (1600ms), then the queue
  and the collapse onto the cap exactly as before. A reader with a name gets the welcome
  and the gap-branched figures; a reader with none gets the mark, the wordmark and the
  three lines (Gain IQ Points / Sharpen Your Mind / Elevate Your Thinking). **It is once
  per ET day (`sot_welcome_day`, unchanged) and it now ALWAYS plays on that visit**: the
  warm-cache floor is gone, because the opening is the brand moment. `?welcome=1`
  previews, `?welcome=0` kills. **THE CURTAIN IS DARK IN BOTH REGISTERS** and every
  colour in it is a literal, not a stage token: painted in the page's own pale ground it
  read as a blank sheet with a sentence on it (owner, same day). On the light register the
  collapse lands on the cap and cross-fades for 200ms instead of colour onto colour.
- **`app/StagePatch.jsx` is THE PATCH, mounted in `app/today/StageToday.jsx` on the cap's
  three user stats and NOWHERE ELSE** (owner, 2026-09-01, after two rounds). It paints NO
  surface: the ten-rung loop alone, standing where the figure will, in the register's own
  ramp (`light` prop: the deep twins on the pale page, the pastels on the near-black one),
  leaving by the endings' clip collapse as the figure stamps in. Two things it was and is
  not: a near-black box ("those look out of place" on the pale cap) and a raised cell
  ("dark does not need a box, it can just be the base element"). It was also briefly on
  Your standing, Today's board and the My games cards; those sit below the fold on
  arrival, so covering them bought nothing and they went back to plain renders. Rules:
  nothing mounts unless the cell is still waiting 260ms after the patch does (a warm read
  covers nothing), a shown patch stays at least 400ms, and it never waits on a rAF. The
  cap cells key on `capWait = who && (!stats.ready || !mineIn)`; `mineIn` is "the read has
  ANSWERED, success or failure", because keying a cover on the VALUE (`mine === null`) is a
  cover that never leaves for a guest. The cells render KEYED children so the StagePatch
  instance survives the placeholder-to-figure swap, which is what lets the collapse play
  over the number. It carries no `<style>`: interpolate `PATCH_CSS` into the page's own
  stylesheet.
- **A FIRST VISIT GETS THE DOOR TOO** (owner, same day). StageWelcome used to stand down
  whenever `sot_theme_intro2` was unset, deferring to the first-load theme flip; that flip
  is RETIRED (`INTRO_RETIRED` in `lib/stage-theme.js`) and never stamps its key, so the
  check had become "never, for any new browser". Gone. The theme pop-up polls the DOM for
  the `.stw` screen and waits its turn.
- **`--stg-brand`: the mark's blue follows the register.** The mark and the word "Loft"
  used to take `--stg-acc` (a category step on a game page: mint on Numbers, orange on
  Trivia; `#0369a1` on the light home) while the app icon carries `#2563eb`. Measured:
  `#2563eb` is 3.70:1 on the dark ground, sky is 1.54:1 on paper, `#60a5fa` fails paper at
  2.35, so no single blue holds. `--stg-brand` is `#7dd3fc` on `.stage-page` and `#2563eb`
  under `[data-stage-theme='light']`; StageChrome, StageFooter, CircuitFrame, StageToday
  read it for both the brain and the `em`, and QuizCommandHeader's navy bar takes sky
  literally. Never hand the brand mark a category colour again.

Verifying: `/?welcome=1&theme=light` and `/?welcome=1` for the Ramp; the patches show on
any load where daily-status or /api/quiz/me outlasts 260ms (`?welcome=0` plus a cache-busting
query, zoom on the cap at ~0.45s). Chrome MCP screenshots time out mid-animation; a
screenshot at 0.6s catches the patches under the fading-in curtain and one at ~2.5s the
words on the dark ground.

## A TYPE-AHEAD MATCHES ON WORDS, AND AN EMPTY LIST OWES AN EXPLANATION (owner rule, 2026-09-02)

Reader report on Focus: "I looked at the picture today and right away recognised the
colouring as Starry Starry Night. Typed the answer and nothing happened... there was
nothing to click on when I first tried, no enter appeared even to say if the double use
of starry was wrong and I'd lost one guess."

Both halves of that are the same class of bug, and both generalize past Focus.

**1. Word order and repeated words are the reader's business, not the matcher's.**
`matchOptions` (app/focus/subjects.js) matched a prefix or a substring of the whole folded
name and nothing else. The day's answer was `The Starry Night`; `starry starry night` is
neither a prefix nor a substring of `the starry night`, so the ONE reader who knew the
answer off frame 1 was the one the box went silent on. Note the shape: the matcher was
strictest exactly where the player was most confident, because a player who knows a thing
types the name they know rather than the name as filed.

Three tiers now, best first, so Enter still takes something predictable: the name STARTS
with what was typed, else the name CONTAINS it, else **every word typed is the prefix of
some word in the name, in any order, with no distinctness required**. Prefixes rather than
whole words because the list rebuilds on every keystroke, so a half-typed last word must
still match; no distinctness because "starry starry" has to find a name carrying one
"starry", which IS the reported case. A single-word query reaches tier 3 with nothing new
to say, so the widening only ever changes a multi-word query. **This is the same rule
`keyHit` already uses for quizzes** (see the quiz key-design section), and a new game that
asks a reader to type a name should start from it rather than rediscovering it.

**2. AN EMPTY SUGGESTION LIST IS A STATE, AND IT MUST SPEAK.** The box rendered no row, no
Enter chip, and a standing hint reading "Type, then choose a name", which is advice for
somebody who has not typed yet. The only acknowledgement of a non-match was a 2.2s toast
that fired on Enter, a key the reader had no reason to press with nothing on screen to
press it for. So the line under the box now flips the moment 2+ characters produce zero
suggestions, and it answers the question the reader is actually asking: **"No name on
today's list matches that. It has cost you nothing."** Persistent, not a toast. The Enter
toast came off in the same pass, since the line was already saying it permanently.

Any input that filters a list owes the reader the same two things: match on what they
would type, and never render an empty result in silence.

**Gate: `scripts/verify-focus.mjs` check 6.** Every bank answer must be reachable by typing
its name, its words reordered, and its last word half typed, plus the reported cases
verbatim. Confirmed to FAIL (37 failures, naming "Starry Starry Night") against the old
substring-only rule, which is the point: a check that has never been shown to fail has not
been tested.

## THE REGISTER IS DECIDED BEFORE FIRST PAINT, and every light rule carries the guard (owner, 2026-09-02)

Reported as "why does a daily puzzle, when in dark mode, flash in light mode for a second
upon load?" It was not a fluke. `lib/stage-theme.js` had it written down as an accepted
cost: a stage page carries `data-stage-theme` on its own root DIV, the server cannot read
localStorage, so that attribute is server-rendered as the DEFAULT and corrected in an
effect after hydration. Light became the default on 2026-09-01, so from that day every
reader who had chosen dark paid one light frame on **every single load, on all eighty
dailies**. The trade was described in the file as symmetric with what light readers used to
pay; it is not, because it is now paid by the people who made a choice.

**The fix is one blocking inline script and one `:not()`.** `app/layout.js` stamps the
resolved register on `<html>` as `data-stage-boot` before the body exists, reading the same
order `readStageTheme` does (`?theme=` review override, then the stored key, then the
default), so the two can never disagree. `app/globals.css` then suppresses the light token
block while that stamp reads dark:

```css
html:not([data-stage-boot='dark']) .stage-page[data-stage-theme='light'] { ... }
```

Four things about that shape, and they are why it was chosen over the obvious alternatives:

- **DARK NEEDS NO MIRROR.** Dark IS `.stage-page`'s own set of values, with no attribute
  selector of its own, so suppressing light is the whole of the fix. Re-declaring the fifty
  dark tokens under a boot selector would have been a second copy to drift, which is what
  this file warns about everywhere else.
- **NOTHING IS WRITTEN AND NO PREFERENCE CHANGES.** The script only reads.
- **THE STAMP HAS TO FOLLOW THE STORE.** `writeStageTheme` and `useStageTheme`'s effect both
  call `stampBoot`, or a reader who switches TO light is held in dark by a stamp taken at
  load. That is the one way to break this, so it is tested first when the switch misbehaves.
- **IT IS BLOCKING AND INLINE ON PURPOSE.** Deferred, moduled or hydrated is a frame too
  late, and a frame too late is the entire bug.

**THE STANDING RULE: any new selector that keys off `[data-stage-theme='light']` on a stage
page carries `html:not([data-stage-boot='dark'])` in front of it.** Without it that rule
fires for one frame on a dark reader and the page comes apart in halves, which is worse than
the flash it replaced. The `[data-stage-theme='light']` rules on the circuit and category
LANDING pages (`app/circuits/page.js`, `app/circuits/[id]/CircuitLanding.jsx`,
`app/puzzle-category/CategoryLanding.jsx`) are deliberately NOT guarded: they set a category
hue and three tier chips, nothing structural, and those are not the surface anybody reported.
Guard them the same way if they ever carry a ground.

**Verify by loading, not by reading the CSS.** Set `sot_theme2` to `dark`, hard reload a
daily, and watch the first frame; then toggle to light and reload again. Both directions,
because the toggle path is the one the guard can break.

## The home paints from the LAST KNOWN PAGE (owner, 2026-09-27)

A return to `/` no longer builds itself on screen. Measured warm before this: statuses at
~280ms, pins at ~640ms (My games inserted, +250px), /me at ~1.0s (the cap flipped from Join a
group to the lens switch, the Gators band dropped in above the slate, My games recoloured);
3 to 4s+ cold after a deploy.

**`lib/home-snapshot.js` stores the RENDERED home and paints it on the next load.** A DOM
snapshot, not a state cache: the page is fed by seven reads through five hooks, and the rendered
page is already the resolved form of all of them. Flow on a full load:

1. `page.js` inline PRE script (before the live page) validates `sot_home_snap` and sets
   `html[data-sot-snap]`, which hides `.sot-live` (opacity 0, not visibility: a child with
   `visibility:visible` would bleed through).
2. Inline FILL script (after `#sot-snap`) pours the stored HTML in, over the live page, and
   marks any tile whose `sot_<key>_day` breadcrumb says it was finished since (moved to the end
   of its row, `done grp`, `--stg-onramp` from `onrampMap()`).
3. React hydrates underneath. `#sot-snap` is rendered with an EMPTY dangerouslySetInnerHTML,
   which is what stops hydration touching the poured-in children.
4. StageToday computes `settled` (stats.ready, mineIn, statusIn, boardIn, useMyGames loaded,
   group standing resolved) and 700ms later calls `releaseHomeSnap`: leaf texts are compared by
   a path of tag + first class + data-fk, RollNum figures roll FROM the snapshot's digits, other
   changed leaves flash once (`.sot-chg`), capped at 24 or it just swaps. 2.4s after settling,
   `saveHomeSnap` stores the page for next time (pops and scripts stripped; ~230KB). **Component <style> tags must stay in the snapshot**: the live page has not mounted the Gators band when the snapshot shows, so its CSS is not in the document yet, and v1 (styles stripped) painted the band as bare text.

**It stands down** (ordinary page) with no snapshot, a different ET day, `sot_welcome_day` not
today (StageWelcome owns the day's first visit), a different identity or register, any query
string beyond tracking params, a hash, or a snapshot over 20h. A 9s ceiling and any tap on a
non-link in the snapshot release it early. A client-side navigation to `/` runs PRE and FILL
from `app/HomeSnapBox.jsx`'s layout effect, since inline scripts do not run there.

The snapshot sits AFTER the live page in the DOM on purpose: `getElementById` and
`querySelector('.stage-page')` return the first match, which must stay the live one.

## Daily finish: doors, set doors, stats, Add to Home, then How to play (owner, 2026-10-03)

`app/StageFinish.jsx` order, top to bottom: the band; Play similar (the set's
first open game, with the countdown); one door per OTHER unplayed game in the
set the band names (`setDoors`, marked "Set", never the Play similar game and
never the game just finished); Play another / Replay / All daily puzzles /
Share; the stats (rival, board(s), archive), always open, no Stats door; claim
your rank; Add to Home Screen (`app/AddToHome.jsx`, phones only). The client's
How to play / Report an issue row follows on the page. While the full card is
up, `body:has(.stf-a2hs)` hides the client's own A2HS, found as the element
right before `<div id="stf-stats-slot" />`, so A NEW DAILY CLIENT STILL
CARRIES ITS A2HS BUTTON IMMEDIATELY FOLLOWED BY THE SLOT
(`scripts/verify-finish-slots.mjs` is the gate).

## A loss never shows the answer, and a replayable loss HOLDS on the board (owner, 2026-10-04)

The finish beat (`lib/finish-beat.js`, `app/useFinishBeat.js`) keeps the board on screen for a
moment before the ending. That board used to be hidden by the ending's `stf-collapse`, so several
clients had been printing the answer under it on a loss (Barter's "The words:" line, trivia
highlights, filled grids). The beat made all of it visible. Rules now:

- **Every client gates answer content on a loss behind `revealed`**: `lost && (!LOFT || revealed)`,
  the Crux model. `revealed` is set only by the end card's Reveal answer door. KEEPS_ANSWER games
  show the answer only on a win. A new daily follows the same rule.
- **A loss plays `playLoss`** ("the gaps go dark"): the squares a player missed dim in reading
  order, then the board settles grey. Per-game miss sets live in `LOSS_MISSES`
  (`lib/finish-beats.js`); without one it falls back to the board's empty cells.
- **On the end card after a loss, the band button reads Retry** (when the game has a replay) and
  Reveal answer is a DOOR on the card (`StageFinish`, `revealOpt` / `bandOpt`). Reveal is never on
  the band.
- **Replayable losses get no intermediate card.** For the `wantsFastRetry` games (End Game,
  Arcade, the graded attempts games, Chomp), an unsolved finish on the stage renders
  `app/LossHold.jsx` instead of the old retry curtain: the loss animation plays over the board and
  then a bar rises from the bottom with Replay and End game card. It STAYS until one is pressed.
  Tapping the bar anywhere but Replay, or Escape, opens the end card; a tap during the animation
  skips to the bar. StageFinish is not mounted while it is up, so the board is never collapsed.

## Every win ends in an IRIS that opens into the curtain (owner, 2026-10-05)

When the stage curtain follows a win (`finale` in `lib/finish-beat.js`, asked for by LoftFinish as
`finaleWanted`: on the stage, not inside a circuit run, read synchronously because the beat decides
on the first render), every daily ends the same way: the finished board stays up for half a second
(`FINALE_LEAD`), then a circle of the category colour opens from the square the player finished on
and grows until it covers the screen (`FINALE_IRIS`, 800ms). That colour is the curtain:
StageFinish's flood mounts over it in the same colour, and the flood's own queue waits for any
figure still loading.

- **The origin is the player's last tap** (a capture-phase `pointerdown` listener in
  `lib/finish-beat.js`), used when it is under 20s old and inside the board's rectangle; otherwise,
  for a keyboard finish, the board's centre.
- Picked from eight mocked endings (iris, stamp, curtain drop, doors, push in, flip, blinds, shrink
  and bloom) after a lock-and-burst and a rising fill were both shipped and pulled the same day: the
  first stuttered on phones, the second paused visibly partway up while it waited for the stats.
- **ONE element, animated by `transform` only.** That is the whole reason for this design: the
  lock-and-burst version shipped the same day (81 squares repainting colour, tiles animated by
  position and size, a fill height set every frame) stuttered on phones, and the owner asked for
  something simpler. Keep any change here to transform and opacity on as few elements as possible.
- The per-game beats in `lib/finish-beats.js` (sudoku audit, crossword sweep, traces) still play
  where no curtain follows (inside a circuit run). Losses are untouched (`playLoss`, LossHold).
- **A def flagged `last: true` plays its own ending BEFORE the iris** (owner, 2026-10-10), and the
  iris starts when that ending returns. Ripple and lock on all thirteen sudokus and the four
  crosswords (Crux has its own split-flap), Exit on Parker, Impound and Junkyard, Lamplight on Anon,
  Current on Hedge, Darkroom on Etch, Gravity on a Four WIN only (`win` sub-def plus `isWin`, read
  off `data-out` on the board, because `.won` is also set on a loss). Mockups:
  https://claude.ai/artifact/7Lep24YDdYvc68ubxaE7Tz. Every one is opacity and transform on cells
  plus fixed overlays (`overlay()`), never layout, for the same phone reason as the iris.
- **Second batch, same rules (owner, 2026-10-10, "apply them to similar types"):** Switch-on on
  Lamps (reads lamp/wall/number off each square's aria-label), Coin flip on Duet and Turn, Snap on
  Snug, Plot (`.pl-plot`, one group per plot) and Carve, Topple on Mate and Queen (the black king,
  CHECKMATE on Mate only), Climb on Rung (only the rungs in view of its scrolling ladder) and
  Hinge, Cascade on Shoe, Crib, Hands and Taire (clones fall to the screen floor; replaced Shoe's
  hole-card flip), Skyline on Towers (replaced its ripple), Crowning on Jesters and Judges (seats
  read off the aria-label). A kind that finds nothing to animate returns 0 and the iris plays alone.
- **Third batch (owner, 2026-10-10):** Rise on Mercury (mercury runs up each thermometer read off the
  `svg[viewBox="0 0 9 9"]` overlay), Seal on Cages (cages found by the missing dashed walls), Odometer
  on Cipher (digits roll column by column, carries hop), Lockup on Links (`.lk-wrap` bands), Timeline on
  Dating (rail through `.dt-node`), Sonar on Sweep (pings from the last tap, correctly flagged mines
  tick), Case closed on Alibi and Docket (ticks then a red stamp), Count on Yose (territory marks fill
  in waves, yours first).
- **Fourth and fifth batches (owner, 2026-10-10):** Fountain on Lode (found chips cloned out of the hexes into the haul, rare and pangram in gold; clones carry computed styles because overlays sit outside the stage), Victory lap on Snake and Line clear on Blocks (both read the CANVAS with getImageData: Snake's body by colour against the most common cell colour, Blocks' stack against the gap pixel, rows always 16), Box run on Chain, Develop on Focus (the fc-view img), Traveler on Paths (a DFS walk over the player's lines; replaced `trace`), Balance on Tally, Dot chain on Polka (replaced its ripple), Tally up on Tuck (Scrabble values in the def, meter read off the score and benchmark text), Homing on Ping (target = the largest circle on .pg-map), Overlap on Venn, Add up on Sums, Clean sweep on Check (`cleansweep`, since `sweep` was taken), Tricks home on Finesse, Family tree on Clade, Bedrock on Strata.
- **Sixth batch, built from the real boards (owner, 2026-10-11, the best of the batch-6 mockups):** Road trip on Span (a marker drives the itinerary rail, `.sp-dot`), Dial in on Circa (guess rows `.cc-row` light, then the winning year `.cc-yr` rolls from the first guess to the answer), Declassified on Redact (every uncovered word, `.rd-w`, is inked over and peeled in reading order, the headline last), Needle on Thread (a needle runs the game's own `.th-thread` path, lighting each knot's tile), Borders on Flank (a pulse runs from `.fl-core` to each `.fl-slot.on`, then the core glows), and Mosaic on Shards (`snap` with `scatter: true`: every shard, grouped by `data-sid`, leaps off the grid and flies back in turn). The other batch-6 mockups were dropped as generic; those games keep the iris alone.
- **Two helpers every kind relies on (2026-10-11).** `bump` and `ring` now write their transform AFTER the element's own computed transform (`baseT`), because animating `transform` replaces it: Flank's centred core (`translate(-50%,-50%)`) jumped down and right the first time it was bumped. And overlays follow the page if it scrolls during a beat (`followScroll`, a `translate` on each overlay measured at its own scroll position, the iris excluded): Jesters' and Judges' court floods hung 10px off the board on desktop when the page scrolled under them. Mercury's tube is painted over the board, so each cell's digit is restamped on top of it and glows as the level passes.
- **Every measurement in lib/finish-beat.js goes through `box(el)`, never `getBoundingClientRect` (2026-10-10).** A kind measures the board while its own animations are already running, and an animation with a delay and `fill: 'backwards'` (or one at delay 0) draws its FIRST keyframe the moment it starts, so a raw read returns the shrunk or shifted box. That shipped on Links: each band was measured mid `scaleX(.4)` and its flash outline came out at 40% of the band's width. `box()` lifts every live beat animation on the element or an ancestor for one read (`Animation.effect` is writable and the clock is untouched). `rectOf`, `unionRect`, `asRows`, `asCols` and `originPoint` all use it. A new kind that calls `getBoundingClientRect` directly reintroduces the bug.
- A tap before the screen is covered removes the fill at once; after, it goes 700ms later, under the
  flood. Other pop-ups wait: `setBeatLive` stamps `data-sot-beat` on `<html>`, and ThanksPop's
  after-a-game timer waits while that is set or a `.stf-flood` is up.
- Review on a live board: `window.__sotBeat('<key>')` plays it without ending anything;
  `window.__sotLastBeat` reports the last beat.

## A STATE CLASS THAT SWAPS ITS BACKGROUND FOR THE STAGE MUST SWAP ITS INK TOO (owner report, 2026-10-08)

Hearsay's docket names (`.hs-key`) were painted `COLORS.accentDeep`, a deep purple, straight onto
the dark stage: 1.6:1. The same file's wrong-name chip, Stands' draw and loss cells and Strata's
bad tile all had the SAME half-conversion: `background:${STAGE ? 'var(--stg-surf2)' : '#fee2e2'}`
followed by a literal `color:#7f1d1d`, so the ground went dark and the ink stayed written for a
pale pink chip (1.8:1). The tell is a ternary on the background and a bare hex on the color in the
same rule. Fix shape: `color:${STAGE ? 'var(--stg-bad)' : '#7f1d1d'}` (or `--stg-warn`,
`--stg-acc-ink`), border likewise. A dark literal is FINE when the rule also hardcodes a pale
background (`.hs-card.win` on `greenSoft`): the chip carries its own ground in both registers.
Sweep: grep every `*Client.jsx` that calls `isStage(` for `color:${COLORS.x}` and `color:#xxxxxx`
inside CSS template rules and measure each against the dark ground; anything under 3:1 whose
background is a stage token is broken.

## New-game pop-ups are for returning visitors only (owner, 2026-10-12)

PremierePop requires `seenBeforeToday()` (lib/visitor.js: the visitor id was minted
before today's Eastern midnight, or has no birth stamp because it predates the stamp
or was adopted) AND a play signal. A per-puzzle save written by today's first game is
not evidence of a return visit. `?premiere=1` still previews.

**Its look is the site's sheet (owner, 2026-11-01: "update the pop-up to match new site style").** Drawn like
the How to play sheet (`app/HelpSheet.jsx`): Manrope only (the mono labels are gone), a 2px ink rule round a 16px
card, a round 2px-ruled close button, the eyebrow as a pastel pill, each game a 2px-ruled tile with its glyph on
the category pastel and a pastel Play pill in dark ink, and a single-game or run card ends in one full-width
pastel pill. The 4px accent rail down each row is gone. Behaviour is unchanged; only markup classes and CSS.

## THE DAILY CLOCK IS HIDDEN BY DEFAULT (owner rule, 2026-10-13)

Players said the running clock made them nervous. On every DAILY puzzle page the
elapsed-time figure in the stage figures row (the figure keyed `'time'`, which all
dailies pass as `{ v: elapsed, k: 'time' }`) now renders as a "Show" control with a
clock glyph. One tap reveals it, one tap hides it again, and the choice is remembered
site-wide in `localStorage.sot_clock_shown` ('1' = shown).

- **It lives in ONE place, `StageChrome.jsx` (`useClockShown`, `isClockFigure`).**
  Never re-implement it per game. A new daily keeps passing `{ v: elapsed, k: 'time' }`
  and inherits the behaviour.
- **Display only.** The clock still runs, still posts `timeElapsed`, still breaks ties
  and still prints on the end card, share text and leaderboards. Only the live readout
  during play is hidden.
- **DAILIES ONLY, not quizzes** (owner). It is gated on `gameKey`, which quizzes never
  pass; a quiz's countdown ('Time left') is something the player needs and stays visible.
- Hidden is the first paint on server and client alike; the stored choice arrives in an
  effect, so there is no hydration mismatch.
- Known stragglers outside the figures row are untouched: Babel prints the elapsed time
  inside its own score line during play, and the circuit run page renders its own
  figures row. Bring them under the same switch if players ask.

### The leader and the leaderboard follow the same rule (owner, 2026-10-13)

`lib/reveal-pref.js` (`useRevealPref`, `REVEAL`) is now the ONE hook for all three
hidden-until-asked things on a daily, each its own site-wide remembered choice:

| Preference | Key | Where |
|---|---|---|
| clock | `sot_clock_shown` | the `'time'` figure, `StageChrome` |
| leader | `sot_leader_shown` | the status strip's "Show leader", `StageChrome` |
| leaderboard | `sot_board_shown` | the strip's "Show leaderboard" (opens the rankings panel) AND the desktop right panel's Board tab, `LayoutCInner` |

- **On a daily the status strip is a ROW of two buttons**, not one button: "Show leader"
  (reveals the leader's name, result and field in place) and "Show leaderboard" (opens the
  rankings panel). It draws from first paint, so it also does the old hold row's job. The
  old leader-only strip is now the quiz path alone.
- **The rankings panel's open state IS the leaderboard preference on a daily**, so a player
  who opens it keeps it open on every daily until they close it. Quizzes keep local state.
- **Desktop Layout C hides `.stg-panel`** because the same preference drives its Board tab;
  without that rule the panel would open inline under the figures as well.
- The Group tab is deliberately NOT gated: opening it is already a deliberate click.

## The home's Quizzes pane: most-played tiles + topic cards (owner, 2026-10-16)

The Quizzes pane in `app/today/StageToday.jsx` (`#sty-quizzes`) is no longer a stack of
topic drawers. It is a search box and a Most played / A to Z toggle, then **Most played**
(12 tiles, all-time plays, at most two per topic), then **By category** (every topic as a
card: total plays, its top four quizzes with plays, and a link to
`/quizzes/all#<topic>`). At phone width the tiles become a swipe strip and the cards fold
into rows, one open at a time. Search filters the full catalogue from `/api/quiz/topics`.

- **All figures come from ONE cached route, `/api/quiz/pane`** (~8KB). It counts plays off
  the shared results cache, holds the answer in-module for a DAY and sends
  `s-maxage=86400`, so the pane never reads the 1.4MB `/api/quiz/stats` and play counts are
  not re-pulled per load (owner, 2026-10-16: quizzes are not played much, so daily is
  plenty). There is no "plays today" figure, since a daily count cannot say it. It only caches a successful count.
- **The catalogue is `catalogQuizzes()` and the topic is `quizDept`**, the same set and
  grouping as the sitemap and `/quizzes/all`; never re-filter here.
- **Two per topic in Most played is deliberate.** Geography's map quizzes hold about four
  fifths of all quiz plays, so a straight top 12 was eight map quizzes. Change
  `TOP_PER_DEPT` in the route to loosen it.
- **Nothing grows on load**: twelve empty tiles and the fifteen skeleton cards hold the
  pane's height until the read lands.

## The home index: Skills or Categories, Easy to hard, and run game chips (owner, 2026-10-18)

From the "Best ideas, full roster" mockups (canvas https://claude.ai/artifact/6AdyVtYtDPVqHtgeevxd2r).

- **A Skills / Categories switch sits under My Puzzles** in the home index (`app/today/StageToday.jsx`,
  `.sty-lens`). **Skills is the default** until the reader picks Categories, and the pick is kept in
  `sot_home_ix` (NOT `sot_home_lens`, which is the retired group lens and is cleared on every arrival).
  A skill pane's id is `'sk:'` plus the skill id; it lists every live game that LISTS the skill
  (`hasSkill`; a game sits in each skill it carries, up to four, tagged liberally, owner 2026-10-18), A to Z, each tile in its own category colour, and wears its skill's `ramp` step
  (`rampCat`). Category panes are always rendered for crawlers; a skill pane renders while the skill
  index is up or while it is the pane on show. Reorder belongs to the categories alone and is hidden
  in skill mode. A skill pane's run pills are the runs holding a game of that skill, plus
  `PILL_EXTRA` of the skill's `pane` category.
- **Entering from the door goes to the SKILL's pane**: `app/EntryDoor.jsx` calls `onPick('sk:' + id)`,
  and the home shows the skill index for that visit without changing the stored pick.
- **Easy to hard is the third sort** (Easy to hard, Popular, A to Z; "Easy" on a phone). Every live
  daily is rated 1 to 5 once a week by `lib/daily-difficulty.js` from the seven ET days ending the
  Sunday BEFORE today (so it changes at midnight Eastern after Sunday and holds all week): the mean
  share of a board solved and the median clock, ranked across games and cut into fifths. A game with
  under 20 plays that week keeps its previous rating; a game never rated lists last as "Not rated
  yet". `/api/quiz/difficulty` stores the week in `stats_payloads` (`difficulty:v1`) and rebuilds only
  when a new week begins. The sort bands every pane into Gentle (1-2), Moderate (3) and Tough (4-5),
  and turns the fitted tile layout off. `scripts/verify-difficulty.mjs` checks the method.
- **The desktop Circuits pane's run cards list the run's games**, numbered in play order, the ones
  played lit (`.gms` inside `runCard`, shown only inside `.sty-rcards` at 901px and up). The phone
  keeps its compact runs block unchanged.

## The entry door's level and puzzle steps, and the dark landing (owner, 2026-10-18)

A skill tile on `app/EntryDoor.jsx` now opens two more steps instead of the home:
**level** (Gentle, Moderate, Tough from `TIERS` in lib/daily-difficulty.js, plus Surprise me; the middle tier's id is still `steady`, only its label changed, 2026-11-08)
and **tiles** (today's runs whose games mostly share the skill's primary, then every game
listing the skill at that level, ranked by the site's plays over 7 days from
`/api/quiz/my-plays` `week`; 1 / 2 / 3 across). A tile goes straight to the game or run.
On a Sunday a NEW visitor also gets a card offering last Monday's boards
(`/api/quiz/entry-boards`, links `?p=<num>`); returning readers get the level buttons alone.
Escape steps back a page. `?entry=new` and `?entry=ret` preview each version.

**A new visitor lands in dark.** "New" is the first door on a browser with no play
footprint and no stored register. Picking a tile, or proceeding to the home, stores
`sot_theme2 = 'dark'` and
`LIGHT_OFFER_KEY` (`sot_light_offer1`) = 'pending'. `LightOffer` in app/ThemePop.jsx
(mounted in StageChrome's cap, LayoutCInner's desktop cap and the home cap with `home`)
offers light on the home once the door clears, and on a game's start gate only, goes the moment a first move lands, and returns on the next gate until
"Switch to light", "Keep dark" or the switch itself answers it. Existing readers keep
whatever register they had.

## The door's step 2: a skill's picks, fitted to the screen (owner, 2026-11-01)

A skill tile on `app/EntryDoor.jsx` opens one more page (phase `picks`) instead of going straight
to the home. Top to bottom: an "All Skills" back pill and the mark, the skill's name, a line
("The N Most Played This Week" or "All N Puzzles, Most Played First"), the skill's runs (the
majority-primary `runs` memo, at most two, full width, a black "Run" pill), then the puzzles, then
the SAME foot as the skill page: a full-width ink pill and the "Loft your Mind" line. The pill reads
"Show All N <Skill> Puzzles" and opens the skill's pane on the home (`toHome('sk:' + id)`); when
every puzzle is already on screen it reads "Go to <Skill>".

**The list is fitted, never scrolled.** `.ent-pk-fit` is measured (ResizeObserver): long rows
(84px, name + `tagLong`) when five or more fit or the whole skill fits; otherwise two-across short
tiles (92px, name + `tag`), at most eight (twice that two columns wider at 640px and up). Puzzles
are ordered by the site's plays over seven days (`/api/quiz/my-plays` `week`), and the list waits
for that read so it never paints in one order and re-sorts. Each tile carries a small dot in its
own category colour. The page wears the skill's ramp step at 45% on white.

## The phone home's type nudge (owner, 2026-11-01)

From a subtle-to-big range of mockups, the owner picked "Nudge": the phone home's category, skill,
All Puzzles and My Puzzles tiles keep their layout, with names at 18.5px (was 15.5) and counts at
13px (was 12); the sideways sizes moved up in step.

**One line per name (owner, 2026-11-01).** A tile name never wraps and grows its row: when the full
name will not fit on one line the tile shows its short form, "Crowd" for Crowd Psychology and the
skills' own `short` (Spatial, Focus, People). `catShortLabel()` supplies it; the tile renders both
(`.lf` / `.sf`), a layout effect measures the full name against the tile's room and sets `sh` (short)
or `fl` (full) before the first client paint, and a CSS container query keyed on the name's length
(`lwNNN`) guesses before hydration. `lib/tile-flood.js` flies the label's `innerText`, so only the
visible form travels.

## The page look menu: light/dark plus Balanced/Full color (owner, 2026-10-19)

The one-tap light/dark switch in every cap is RETIRED. The same icon (marked `data-look`) now opens
`app/LookSheet.jsx`, mounted once in the root layout and opened by `openLook(anchor)` from
`lib/stage-theme.js`. Two choices: Background (Light / Dark, `sot_theme2`, unchanged) and Color
(Balanced / Full color, `sot_color1`, stamped on `<html>` as `data-stage-color` by the boot script
before first paint; `?color=` is a review override).

- **Balanced is the default and is the site exactly as it was.** Existing readers keep their register
  and land on Balanced. **Full color** fills every unplayed home tile and run Play chip with the soft
  category step and `RAMP_INK`, in both registers (fills soft, small marks stay deep on the light page).
  Its rules live in StageToday's stylesheet under `html[data-stage-color=full]`. It never touches a
  puzzle board.
- **A grey (Mono) level was built and DROPPED the same day.** In grey the right / close / wrong colors
  and several REGION_RAMP steps land on the same grey (light good 105, warn 107, bad 96; dark sky and
  amber both 199), so color-only boards stop speaking. Do not add it back without a second cue on every
  color-coded board.
- **First visit:** a NEW browser (no play footprint, no stored register, or the door's pending light
  offer) gets the intro version once (`sot_look_intro1`: 'shown', or 'skip' for a browser with history):
  page dimmed, the icon lit through a hole, both choices spelled out, Done. It waits for the entry door,
  the premiere and groups cards and the arrival screen. Every later open is the short drop-down (two
  button rows). `?look=intro` previews it without stamping.
- The old ThemePop bubble and the LightOffer are stubbed to `return null` (their mounts remain); the
  intro answers the light offer.
- The Leaderboards + Stats pane's "Every game today" grid is sorted by plays today, most first, ties
  A to Z (`app/today/BoardsPane.jsx`).

## NO POP-UP MID GAME, EVER: `lib/game-active.js` (owner rule, 2026-10-23)

"GET RID OF ANY AND ALL MID PUZZLE / GAME POP-UPS." Every pop-up on the site asks
`gameActive()` at the moment it would open and stays shut when it says yes. It is
read fresh each time, so a timer armed before a game started still cannot land on it.
Playing means: a run page (any run's `path`, or `/circuits/<id>/run`) whose
`sot_run_*` save for today is in phase `playing`, the gap between two of its puzzles
included; a daily's page from its first move (the `sot_<key>_day` breadcrumb) until
it is done, or a started archive board (`?p=N`); any `/quiz/`, `/kids/` or `/vs/`
page before its finish card. A finish card on screen (`.stf, .loft-back,
.dec-backdrop`) always means over. `lib/post-game-gate.js` checks it too, and
TrophyPop holds an unlock until no game is in play. **A new pop-up calls
`gameActive()` before it opens. No exceptions.**

## Phone ending: the rolling ending (owner, 2026-10-28)

On a phone (under 901px) every daily ends on `app/StageRoll.jsx`, mounted by StageStick's phone
branch. Desktop is unchanged. Three beats play one at a time and each ROLLS UP into the result bar:
the message (verdict + the game's key figure), then the stats (today's field, against yourself,
today's board + group), then the final view, which is only **Play next** (run, Play similar, Play
another, the category's glyph tiles, every category, See all Daily Puzzles) and the **Challenge**
(Challenge a friend with the drawing-ticket line, and the meme GIF peek, full frame), in that order. Mock-up: the "Rolling Mobile
Ending" design canvas.

- **The result bar** is one full-width card (16px radius like the other cards): verdict + key
  figure + standing. The standing is the GROUP (`#2 of 5 in <group>`) when at least one other member
  played this game (read from FinishGroupLine's `onData`), else the overall board (`rankHead`). Its
  text sizes itself to the width: the group name drops first, then the type shrinks, floor 13px.
  Its dropdown opens Show Board (a button, never the board itself), the result, the stats, the
  board and the record card; closing rolls them back up.
- **Header:** the Mind Loft house + name (to All Puzzles), Replay, Share (share for credit). No
  outlines on header buttons, and NO text links anywhere on the ending.
- **Play another** opens the game's archive IN PLACE as a month calendar, played days filled ink,
  unplayed outlined. It falls back to a plain link only when no archive date parses.
- **The replay pop-up games** (LossHold: End Game, attempt-ranked, Arcade, `fastRetry`): on a phone
  an unsolved finish skips LossHold, plays this ending, and the final view LEADS with Replay
  instantly (`retryOffer` from LoftFinish, chip and sub from `dailyAttemptRule`).
- **No loss colour.** The phone ending is always the category pastel; `t-lost` is not applied.
- A reopened finish (not fresh, per `pageAge() < BEAT_FRESH`) and reduced motion land straight on
  the final view. `?flood=1` forces the full sequence on an archive replay for review.

**Scored games never say Solved (owner, 2026-11-01):** a game graded on a score (Hands, Whittle, Crunch when it misses the target) headlines through `endGrade(score, 10, 'Perfect!')` (Perfect!, Great job!, Good job!, Good effort, Fail), never `endEfficiency`/`endSolved`, which are for real solves. Hands above par but short of ace reads 'Great job!'.

**Verdict words (owner, 2026-10-28):** `FAIL` ('Fail') in `lib/end-verdict.js` is the word for an
unsolved solve-or-not game and for a scored run that got nothing. 'Good effort' is only for a scored
run that got something (1 of 35 on trivia is Good effort, 0 of 35 is Fail). No client writes
'Good effort' for an unsolved board.

## Phone run ending: the rolling run ending (owner, 2026-10-28)

Every run's ending on a phone (`GauntletEndStage` in `app/GauntletScreens.jsx`, so the Trivia, Math
and English Gauntlets, Price Check, Passport, Enter the Dojo, Judged, Read the Room and Crossed Up)
renders `app/RunRoll.jsx` below 900px. The sweep and the score counting up the title ladder still
play; when the count lands the hero rolls up into ONE full-width bar (`74 right · Know-It-All · #39 of
214`, shortened before it shrinks). The bar's dropdown holds the climb, the rank note, the prize,
today's board, the run's own card and the leg-by-leg table. The page below is Play next (one quick play
next, the other runs, See all Daily Puzzles) then the Challenge tray (challenge, Polymath meter, the
full GIF, Share Your Score). Header: Mind Loft home, Practice, Share, no outlines. Any tap on the hero
skips to the bar; reduced motion lands there. Desktop is unchanged.

## Desktop ending: direction B, one sheet (owner, 2026-10-26)

On desktop the one-page ending (`app/StageStick.jsx`) is ONE sheet in the page's own materials:
the raised surface with the 2px ink rule and 12px corners the rails wear, the category colour only
on the result band across its top, the sections below divided by rules rather than boxed as pastel
cards. While it is up the sheet stays in the board's column and the right rail turns into **Up next**
(owner, 2026-10-26, replacing the fold, which left the sheet off center): StageStick portals `.sst-rail`
into `.lc-side` (most played today from `/api/quiz/pulse`, more in the category, quizzes, categories) and
the rail's tabs hide while it is there. Keep playing renders in the sheet only when there is no rail. By the sheet's own width (container queries): 1000px+ is board | group |
challenge in three columns; 700-999px is board beside group with the challenge full width under;
below 700px it stacks. The overall board pads to five places with "Empty"; the group card lists only
members who have played (no empty slots). "Keep playing" closes the sheet: category chips, more
puzzles in the category, and the most-played quiz per department (`/api/quiz/popular-by-category`,
the game's own department first). The record card is desktop-hidden; the game page's You and
Archive tabs carry it. The phone ending is unchanged. Motion: while the colour pulls back, the sheet
and the band's own result are already showing (`.sst-page.rt`), so the hand-off is one move; the
sections rise in after.

**Left index on a puzzle page:** the game's own category header is highlighted but NOT opened; its
list opens only when clicked (`LayoutCInner`, `shownCat = openCat`).

## No Rankings drawer in the game header (owner, 2026-10-26)

The cap's Rankings chip, its drawer (DailyBoardPanel / QuizLeaderboard under the header) and the strip's
"Show leaderboard" toggle are removed sitewide (`app/StageChrome.jsx`). The drawer read the same
remembered preference as the desktop rail's Board tab (`REVEAL.leaderboard`), so a window narrowed past
the desktop breakpoint showed it already open under the phone header. Standings live on the ending sheet
and the desktop rail. Do not reintroduce a header drawer; the `panelBody` prop is accepted and ignored.

## Up next offers runs, not their parts; the puzzle nav mirrors the home (owner, 2026-10-26)

The ending's Up next rail (`app/StageStick.jsx`, `RUN_OF` / `foldRuns`) never links a question set of a
gauntlet-style run (engines quiz, math, price, passport: the Trivia/English/Math Gauntlets, Price
Check, Passport with Span/Flank/Ping); it offers the run instead, once. Standalone dailies a run also
deals (Dojo sudokus, Judged cases, crosswords) stay themselves. The puzzle page's left nav (`LayoutCInner`)
IS the home's index (owner, 2026-11-11): one joined box of rows (`.lc-ixbox`) in the home's order (the
categories or skills, then All Puzzles and My Puzzles, or the reader's Reorder from `sot_cat_order` /
`sot_skill_order`), each with its count and fill. EVERY ROW IS A LINK TO THE HOME with that pane open
(`/#cat=<category or skill id>`, which the home's layout effect reads); nothing opens in place, so the
old in-page game sublists are gone. The game's own category stays marked. Then the switch, then an
"Everything Else" box (Runs, Quizzes, Puzzle Archive, Leaderboards + Stats / IQ Tests, School Tests,
Kids, Top 10 Lists / Most Appreciated). Change both together.

## The stage board for Ping, Flank and Span (owner, 2026-10-26)

Ping, Flank and Span draw their play area with `app/StageLeg.jsx`: the gauntlet
stage's shape (kicker, the question big and centred, a 2px-ink input tile, the
answers as ink-bordered tiles, a quiet foot line with Give up). It replaces the
old board in BOTH homes:

- **Inside the Passport run** the board reads the run frame's tokens
  (`--gsx-ink`, `--gsx-card`, `--gsx-card-paper`), so it follows the run's five
  looks. The run mounts the games through `RunEmbed` with `autostart`, so a leg
  opens straight on its board with no start gate. The Sizes leg uses the same
  shell (`sizesLeg()` in `PassportRunClient.jsx`).
- **On each game's own page** it sits on a WHITE page (owner: "white background
  versions for the individual puzzles") with the game's category pastel on the
  tiles. `LEG_PAGE_CSS` paints the light register's ground white; its selector
  carries an ID in `:not()` on purpose, to outweigh the phone look rules in
  globals.css (`html[data-stage-pastel]:not(#sot-x)`). The dark register is
  untouched.

**StageLeg only draws.** Every rule (matching, scoring, saves, stats, the
`/api/quiz/result` row, the abandon flush, the run hand-off) stays in the game
client, so the run and the page cannot score differently. `LEG_ON` in
StageLeg.jsx is the one switch back to the old boards; the old JSX is still in
each client behind `!LEG`. Ping's ring map on the stage board is drawn in ink
with solid rings only (no dashed lines); the closest ring is heavy. Flank still
hides a missed border exactly when its old ring did (`!LOFT || revealed`).

## THE MARK IS THE HOUSE M (owner, 2026-10-26)

The Mind Loft logo is a solid house whose lower half IS the M: the walls are
the M's legs, the roof hangs into the M's middle V, and the opening under the V is
a TRUE TRANSPARENT CUTOUT, so it always shows whatever the mark sits on (owner: "the
cutout should match the background always"). It replaced the caret-and-brain mark.

- **One drawing, `lib/mindloft-mark.js`** (`HOUSE`, `markInner`, `markSvg`).
  `app/MindLoftMark.jsx`, the share cards (`lib/og-stage-card.js` `markURI`,
  `lib/share-palette.js` `markSvg`, `lib/og-kids-card.js`), the kids shell and both
  icon scripts all read it. Never paste the path anywhere else.
- **A2 (owner, 2026-10-26): the HOUSE carries the colour, the words are plain ink.**
  The fill is `accent` (default `var(--stg-brand)`: sky on the home, the category hue on a
  game page). "Loft" is NOT coloured anywhere any more; every wordmark em/span inherits ink.
  Black is available: `mono` on the component, or `data-brand-mono` on any ancestor.
- **Outline only where needed.** A pale house gets a thin outline in a deeper shade of its
  own colour (`deepen`, same hue at 40% lightness) when the fill is under 3:1 against its
  ground (`outlineFor`). The component measures its computed fill and the first opaque
  background behind it after mount and re-checks on theme changes, so sky on the light home
  is outlined and a deep category step, or anything in dark mode, is not. String builders
  pass `ground` (share cards are white, so their pastel house is outlined).
- **Print and share masters**: `node scripts/build-brand-marks.mjs` writes transparent SVG +
  1024 PNG of the sky mark (outlined, for light paper), sky without outline (dark grounds),
  black, white, and every category pastel in both forms under `public/brand/marks/`.
  The favicon and app icons are separate (`build-app-icons.mjs`, black house on light sky,
  owner kept them as they are) and must pass `ink: MARK_INK, outline: null` explicitly.
- **Cap-aligned beside the wordmark.** When the next sibling element reads "Mind Loft",
  the component measures its font size after mount, switches to the tight viewBox and
  sizes itself to Manrope's cap height (0.72em) on the baseline, so the roof peak and
  wall feet sit on the top and bottom of the M. No call site passes anything for it.
- **Icons**: `node scripts/build-app-icons.mjs` writes the site set (black house on the
  light sky #b1e5fd) plus `public/brand/icons/mindloft-<category>-{512,180,32}.png`.
  Needs `@resvg/resvg-js` installed for the run.
- After any change to the mark: rerun `build-brand-marks.mjs` (and `build-app-icons.mjs` if the icons should change), then
  `node scripts/bake-og.mjs --site` (every share card carries it).

## The ending follows the dark look (owner report, 2026-10-27)

The play registers stand down while an ending is up, so the ending used to paint the light stage tokens
and the pastel ground even in Black with color. `app/globals.css` (THE ENDING IN THE DARK LOOK) now puts
the ending on the near-black page with the category deepened onto it, and `groundOf` in
`lib/finish-beat.js` paints the win iris in that same colour. Any new ending surface must read the
`--sst-*` / `--stg-*` tokens rather than hardcoding a light ground.

---

## Full-bleed rows state their corners (owner rule, 2026-10-27)

Owner report: "the black selection bar does not fill the full element - this happens often." The
quiz Topics rail on the home: the selected All Topics row was black with curved corners that pulled
away from the panel edge, so the fill looked short of the row.

**Cause.** `app/globals.css` rounds EVERY `button, input, textarea, select` 8px. A list row, card
head or strip built from a `<button>` and stretched edge to edge inside a framed panel
(`width:100%` with its own border stripped) silently inherits that 8px. While the row is
transparent nobody sees it; the moment it fills (selected, hovered, a coloured head band) its
corners curve and leave notches against the panel's square inner edge. The first sweep found 21
rules carrying it, among them the Topics rail rows, the Top Topics card heads, the quiz list rows,
both sort menus, the Leg and Ping suggestion lists, and the stage and run strips.

**Rule.** Any CSS rule that sets `width:100%` AND `border:0` / `border:none` must also set
`border-radius` explicitly: `0` for a full-bleed row or band (the panel's `overflow:hidden` and
radius round the outer corners), `inherit` for a transparent overlay that covers a rounded parent,
or the value you mean. Never rely on the global 8px for a row.

**Gate.** `node scripts/verify-full-bleed-corners.mjs` (or `REF=origin/main node ...` to check a
ref without a checkout) fails on any such rule without a radius. Run it before every push that
touches CSS. If a rule truly gets its radius from another file (e.g. `.loft-next.d5f-retry`
borrows `.loft-next`'s 11px from LoftCap.jsx), put `/* corners-ok: why */` inside the block.

**Live check** (a component can still build a row the gate cannot see, such as inline styles).
In the browser console on the page:
`[...document.querySelectorAll('body *')].filter(e=>{const p=e.parentElement;if(!p||!e.offsetParent)return 0;const ps=getComputedStyle(p),r=e.getBoundingClientRect(),q=p.getBoundingClientRect();return parseFloat(ps.borderLeftWidth)>0&&parseFloat(ps.paddingLeft)===0&&Math.abs(r.left-q.left-parseFloat(ps.borderLeftWidth))<1&&Math.abs(q.right-parseFloat(ps.borderRightWidth)-r.right)<1&&parseFloat(getComputedStyle(e).borderTopLeftRadius)>0&&r.width>60})`
must return an empty array.

## How to play is ONE sheet, opened from the ? (owner, 2026-10-27)

Every daily's rules modal is `app/HelpSheet.jsx`: the site's sheet (2px ink border, 16px corners,
stage tokens), a ? disc and "How to play", the game's own rules body, a full-width **Close** button
(it only closes; it never starts play), and the Report an issue link at its foot. A client renders
`{showHelp && <HelpSheet onClose={...} self="<key>" name="<Name>">{rulesBody}</HelpSheet>}`; the
close handler is the game's own (it stamps the seen-the-rules key). The 138 inline modals were
converted by codemod; a new daily copies this line, never an inline modal.

The **?** opens it from every header: StageChrome's cap, the phone StageTopBar (via
`lib/stage-help.js`, which the cap registers its `onHelp` into), and the desktop Layout C cap
(`useStageHelp`). The How to play link at the foot of the page is gone (`ReportIssue` no longer
draws it; `onHelp` is still accepted). The page foot keeps Report an issue.

## The Numbers dailies and the board accents on the stage (owner, 2026-10-30)

Calc, Carve, Cipher, Crunch, Sums and Tally play on `PlayStage` at every width (the same
`STAGE && phoneStage && !!g.t0 && (playing || !revealed)` mount the other stage games use),
drawn from the owner-approved mockups. Each client keeps its old board behind the stage
untouched; the stage only draws and calls the board's own handlers, so scoring, saves,
posting, hints, share text, archives and the finish are unchanged. In-page Reveal buttons
became the foot's two-tap Give up (Cipher had no arm step, so it gained a local `armGive`).
On-screen digit pads (Cipher, Sums) hide on a desktop with a fine pointer, where the keyboard
types the digits.

**Board accents.** `PlayStage` now sets, from the game's pastel and the look: `--pst-acc`
(the full pastel: picked, active, confirmed; always carries `--pst-on-acc`, the dark ink),
`--pst-pale` (the pale tint: secondary highlights, from the brief's table: mint #d1fae5, sky
#e0f4fe, rose #ffe4e6, gold #fdf3d7, orange #ffedd5), and `--pst-cell` / `--pst-cell2` /
`--pst-cell-line` / `--pst-mute` for grey squares, rules and muted type. Dark looks sink the
pale and grey steps onto the near-black page. Plain squares stay white or light grey, never
coloured. Errors use `--pst-bad` on `--pst-bad-bg` (red #b91c1c on #fee2e2 in light, pale red on deep red in dark).

## The phone stage title is centred on the screen (owner, 2026-10-30)

`app/StageTopBar.jsx`, under 900px: the title block is absolutely positioned on the bar's true
centre; both sides reserve `--stb-side`, the wider of the back pill and the right-hand button
group (measured with a ResizeObserver), so the name never runs under a button, shrinks with
the screen (`clamp(15px, 4.9vw, 19px)`) and then ends in an ellipsis. Share is an icon-only
34px round button on phones (aria-label "Share"). Desktop is unchanged. Every stage page that
draws this bar inherits it: PlayStage, WordStage, BracketStage, GauntletStage and the run
screens, StageChrome's simple header, and Price Check's week.

**Desktop, 2026-11-09 (owner: "the puzzle title needs to be centered above the board, assuming
all elements fit", seen on Carmen):** the bar spans the board's column, so its true centre is the
board's. At 900px and up the same measure adds `.stb-mid` when the dot + name (and the line under
it) fit in `bar width - 2 * --stb-side`; the title block is then positioned exactly as on the
phone. If it does not fit, the class comes off and the title falls back to the 2026-11-01 rule,
centred in the space between the button groups.

## The desktop ending cover is left-aligned, not centred (owner, 2026-10-31)

51ba941d4 (2026-10-30) centred the result on the desktop ending cover (`.sst-cover .sst-hero` in
app/StageStick.jsx: text, verdict, metric and arc on the centre line). The owner asked for that to be
reverted: the cover keeps the left-aligned layout of the in-page band it fades into. The column itself
stays centred (`.sst-in` max-width 560px, margin auto). The phone ending (StageRoll) was never centred.
Do not centre the cover's contents again without asking.

## The Judged boards on their own pages (owner, 2026-10-31)

Owner: "alibi for instance still has old format". Ergo, Docket, Alibi, Sworn and Hearsay now
play on `PlayStage` on their own pages at every width (the same
`STAGE && phoneStage && !!g.t0 && (playing || !revealed)` mount the Numbers games use; Ergo and
Docket gate on `loftRevealed`), in the rose look the owner approved for them inside Judged
(AlibiRose / AlibiRoseDark): white page, rounded tiles with a 2px ink rule, pale rose on what can
be tapped, full rose with dark ink on what is confirmed, selected or primary, the brief (rules,
conditions, the story) straight on the page. The shared half is `app/LogicStage.js`
(`LOGIC_STAGE_CSS`, `lgs-` classes); each client adds its own board rules (`egs-`, `dks-`, `als-`,
`sws-`, `hss-`). Old progress pips and in-page Reveal / Give up buttons fold into the foot's
two-tap Give up (Alibi, Sworn and Hearsay gained a local `armGiveUp`; Ergo and Docket use their
own two-tap `giveUp`). Docket's sketch is the same `DocketSketch`, re-inked onto the stage tokens.
Presentation only: every control calls the board's own handler.

**Laid out from the mockups (owner, 2026-10-31: "make them look like they did on the mock ups").**
Ergo, Docket, Sworn and Hearsay follow the Next Wave mockups (drawn in the old Logic lime, built in
rose), Alibi follows AlibiRose / AlibiRoseDark. Rule numbers are plain ink; the question sits large
and centred with its answers at the foot (`lgs-fill` / `lgs-grow`); a selected witness and the
second speaker in Hearsay are ink cards with pale rose type (`lgs-inv`, `--pst-inv`). Ergo: tap a
rule to flip it, the filed statements fold under "Take one back". Docket: the setup's first line
(tap for more), the sketch as a slot row over the letters, the cross-off kept at the row's end.
Sworn: witness cards, the selected one carries True / Lying, one big Accuse. Hearsay: speech
bubbles, the list as a two-column grid. Alibi: one clue at a time (arrows, pips, Cross off, All
clues), a Room / Time / Item switch, one board at a time. Deliberate differences from the
mockups, each to keep existing behaviour reachable: Ergo's bins, Docket's notes and cross-off,
Sworn's True / Lying marks and hint, Alibi's Undo / Reset / Auto ✗ and Check my accusation, and
the Judged header (the run's own frame) and the foot row (Clock, How to play, Give up).

**Logic on the stage.** `accentVars` gives rose its approved values: dark-look tile `#4a2a33`,
full rose carrying `#0b0f1a` in the dark looks, `--pst-deep` (`#be123c` light, rose dark) for rose
as text, and a wrong mark ORANGE (`#c2410c` light / `#fb923c` dark) via `--pst-bad`.

**One board in Judged.** Embedded (RunEmbed), each client draws the same stage `inline` in the
run's frame, follows the run's own look (`RunEmbed look`, passed to `PlayStage look`; `plain` and
`dark` keep the board colourless) and hides its old page column with `lgs-hosted` on its root.
The `.jd-rose` / `.jd-rosedk` overrides in JudgedClient were retired. Stands is not in today's
Judged roster and was left alone.
## Full view: every clue beside the board (owner, 2026-10-31)

Owner: "a fuller view option on desktop to show all clues for alibi and others"; players had
complained about **Alibi** and **Stands**, whose clues only work side by side (Alibi's chained
clues, Stands' points facts) but showed one at a time on the stage. `app/ClueView.js` holds the
shared half: `useClueView()`, the `One at a time | Full view` switch (`ClueViewSwitch`) and
`CLUE_VIEW_CSS` (the switch, the `cvs` clue sheet, the `cvs-wrap` two-column layout).

- **When:** desktop FULL SCREEN only (`useStageMode() === 'full'`, i.e. `html.lc-focus`) at
  1000px and up. Full view is the default there (whole board by default, 2026-10-30); the
  player's choice is remembered on the browser under `ml_clue_view`, one key for every game.
  With the site navigation showing (inline) the column is too narrow, so it keeps one clue at a
  time. Not inside Judged (RunEmbed keeps the one-board stage).
- **Width:** `PlayStage full` widens the column to `min(1180px, 96vw)`; the top bar lives in the
  column, so its ends line up with the play area (owner, 2026-10-31: header elements expand to
  match width).
- **Alibi, ONE LONG GRID (owner, 2026-11-01: "names should be on x axis", "why repeat names
  for each grid, make them one long grid"):** the suspects run across the top ONCE and Room,
  Time and Item stack beneath them as labelled row groups (`alf-gl`, a full-width rule). The
  one-at-a-time board is transposed the same way: suspects across, that board's options down
  the side. Every clue in the sheet; click crosses off (the save's own `struck`), hover lights
  the suspects it names (`s`, `s1`, `s2`) in the name row. The old side-by-side groups with
  names stood on end (`alfRot`) are gone; do not bring back a per-board name column.
- **Stands:** grid, table and tools on the left, every fact on the right. Crossing off a fact is
  presentation only (localStorage `sdx-off-<quizId>`). Hover: a beat / drew fact lights its one
  square and both club labels; a club fact lights that club's row; the table row tints.
- **Below 1000px (and inline): THE SWITCH SHOWS TOO (owner, 2026-11-01).** Full view there
  STACKS (`useClueView().stack`): every clue / fact as a list, then the whole board, and the
  stage scrolls. Alibi's stacked long grid pins its name row (`alf-gr.sm`, sticky). `side` is
  the beside-the-board desktop layout, and only `side` sets `PlayStage full`. The narrow choice
  is its own key, `ml_clue_view_sm`, defaulting to One at a time, so a desktop full-view
  player is not handed the long page on a phone. The card's **All clues / All facts** still
  swaps the list in for one-at-a-time play; on a full-screen desktop it switches to Full view.
- **Audit (2026-10-31):** Sworn, Ergo, Docket and Hearsay already show every statement / rule;
  Stet, Feud, Outwit, Dating and the gauntlets are one item at a time by nature. Sudoclue is not
  on the stage yet; when it moves, give it full view. Jesters, Venn, Plot, Judges and Duet not yet
  checked for hidden constraints.

## Axiom, Duet and Fib on the white stage (owner, 2026-10-31)

The three Logic dailies play on `PlayStage` at every width with the same
`STAGE && phoneStage && !!g.t0 && (playing || !revealed)` mount as the Numbers games, built
from the approved mockups (Axiom.dc.html, Duet.dc.html, Fib.dc.html). Presentation only: every
control calls the board's own handler, so tests, scoring, saves, posting, hints, share text,
archives, Sunday Editions and the finish are unchanged, and the old board stays behind the stage.
None of the three is in a run or circuit.

- **Rose on the picked, the confirmed and the primary button.** Axiom: a word that fits the rule
  is full rose, one that does not is white with a light rule, a given word carries a small dot,
  a crossed-out word or rule fades and is struck, the tap switch reads Cross out / Test a word,
  and Name the rule is the full-width primary. Duet: the picked square is rose, its row, column
  and room pale rose, printed squares light grey, dots and rings ink, rooms walled in heavy ink,
  and the = / x marks sit in small white discs on the shared edge. Fib: the picked square rose,
  its row and column pale rose, printed squares light grey; a sign is white until both ends are
  filled, grey once the grid keeps it, rose when accused.
- **Wrong is orange on Logic** (#c2410c on #ffedd5 light, #fb923c on a deep brown dark), set per
  look from `useStageLook` as `--axs-warn` / `--dus-warn` / `--fbs-warn`: a wrong rule name, a
  square or mark that breaks a Duet rule, a broken Fib sign, a repeated Fib digit. Duet's old
  striped and dashed break marks are not used on the stage (no dashed lines).
- **Duet's pips are replaced by the need card**, as drawn: one pale rose card says what the picked
  square's row, column and room still need, and turns orange with the rule it breaks when the
  board breaks one. The pips still draw on the board behind the stage (and with `?stage=0`).
- **Give up** folds each game's Reveal into the foot's two taps; Axiom had no arm step, so it
  gained a local `armGive` (400ms minimum between taps, like Calc). Fib's digit pad hides on a
  desktop with a fine pointer, where the keyboard types the digits (and N, Backspace, arrows).
  Duet's 10x10 Sunday passes `wide`.
- **Boards fit the height they measurably have** (`lib/play-stage-fit.js`, the
  `lib/stage-fit.js` rule for PlayStage hosts). Duet's and Fib's square boards cap their width
  at the stage height minus everything else in the column, measured, never a constant; a bar
  the flex column stretches is counted by its contents, so the board cannot shrink into slack it
  made. Axiom is `wide` on desktop: six words to a row (seven on Sunday) and the rules in three
  columns; on a phone Sunday's 28 words go five to a row. All three Sundays fit 390x844,
  1280x900 and 1280x720 without scrolling.
## Hedge, Venn and Suffice on the white stage (owner, 2026-10-31)

The three Logic (rose) dailies play on `PlayStage` at every width, with the same
`STAGE && phoneStage && !!g.t0 && (playing || !<board-view flag>)` mount the Numbers games use
(Suffice's board-view flag is `loftRevealed`; its `revealed` is the per-item answer panel).
Each client keeps its old board behind the stage untouched; the stage only draws and calls the
board's own handlers, so scoring, saves, posting, hints, share text, archives and the finish
are unchanged. None of the three is in a run or circuit.

- **Hedge:** the lattice is one SVG on a `--pst-cell` field; numbers and dots ink, a settled
  number at .35 opacity, the loop rose (`--pst-acc`) inside an 11px ink casing, a loose end a
  rose ring, an x note muted. A line off the loop is SOLID orange with no casing (the old board
  dashed it; no dashed lines on the stage), and the status note says "orange line" instead of
  "dashed line". The note sits on the pale tint, or on grey with an orange edge when it reports
  a problem. Mark / Line switch, Undo and Hint under it; the old Reveal link is the foot's Give up.
  Sunday 10x10 passes `wide`. The diamond hit areas and hold / right-click to draw are unchanged.
- **Venn:** the three circles are ink on a light grey wash (the A/B/C hue coding is dropped on
  the stage, as in the mockup); each region is a white count button (pale rose while a word is
  held, rose badge when its count is met, orange edge when over). The tray holds the unfiled
  words; filed words sit in a second row as pale chips with their region and an x (the old
  phone roster), so lift and unfile still work. The old one-tap Reveal became the foot's
  two-tap Give up (a local `armGive`, 400ms minimum between taps).
  **Venn fits the screen with no scroll** (owner, 2026-10-31), down to 360x740 on the longest
  tray in the bank (No. 108, a Sunday of fifteen element names): every other row keeps its
  natural height and the diagram takes the height left, MEASURED each render (`stageFit`, the
  same reasoning as `lib/stage-fit.js`, floor 200px wide); the region buttons and pips scale
  with it (`--vs`). A long tray (more than 12 items or over 80 letters) drops the chips a size,
  short screens (max-height 780px) tighten the gaps, the filed row is one line that scrolls
  sideways, and every row but the diagram is pinned (`flex-shrink:0`, the bar `flex:none`) so
  nothing clips or steals the room.
- **Suffice:** pips (rose right, orange wrong, ink current), the question on a pale rose card,
  two statements on white with a grey rule, the three yes / no rows, Submit, then the reveal card
  with the counterexample and Next item. "That makes your answer" stays as a quiet note.

**Logic's wrong mark is orange** (#c2410c light, #fb923c dark), not PlayStage's red
`--pst-bad`: each client reads the look with `useStageLook` and sets `--lg-bad` on its board.
## Stands, Snug and Plot on the white stage (owner, 2026-10-31)

Stands, Snug and Plot (Logic, rose) play on `PlayStage` at every width with the Numbers games' mount
(`STAGE && phoneStage && !!g.t0 && (playing || !revealed)`), drawn from the owner-approved mockups.
Presentation only: every control calls the board's own handler, so scoring, saves, posting, hints,
share text, archives, Sunday Editions and the finish are unchanged, and each old board stays behind
the stage untouched. Wrong marks are Logic ORANGE (`--lg-bad`: #c2410c light, #fb923c dark, on
`--lg-bad-bg` #ffedd5 / #3a2312), set per look from `useStageLook`, never red.

- **Stands**: one surviving fact at a time on a pale card, **Back / Skip** walk the facts (they wrap),
  and the pips jump; a pip fills when its beat / drew result is already on the grid (read off the
  player's own cells, never the answer), and a rejected sheet turns the card to the first fact it
  breaks. Grid cells: W the full rose, D the pale rose, L an ink outline, blank white with a light
  rule; tap cycles, hold or right-click steps back. Tools: Hint (the old Nudge, same handler and
  cost), Clear, File the table. The one-tap "Reveal (ends the day)" became the foot's two-tap Give
  up (a local `armGive`). A rejected sheet's verdict is the foot line, in orange. **Inside the Judged
  run (`useRunEmbed()`) the stage does not mount**: the run keeps the old board its `.jd-host` rules
  dress, so JudgedClient needs nothing. (Stands only sits in the pre-2026-10-11 Judged roster.)
- **Snug**: the board (open squares light grey, holes absent, a placed piece a step between `--pst-acc` and `--pst-pale`,
  read from PlayStage so it follows the tokens; `SGX_STEPS`), the hand row with Rotate / Flip, and only the pieces still
  on the pad. Touch aims with a first tap and drops on the second, a mouse previews on hover, exactly
  as before. Fit It (`/kids/fitit`) has its own client and is unchanged.
- **Plot**: a call line naming the drag ("Dragging 3 by 2 covers 6 squares around the 6"), the board
  (grey squares on white; a claimed square goes clear over its plot, the full rose with an ink edge;
  a wrong plot orange and striped), Undo and Hint. While the stage is up its grid holds `gridRef`, so
  the board's own `cellFromPoint` measures the stage board (the old grid drops the ref).
## Chain, Redact, Dating and Stet on the white stage (owner, 2026-10-31)

All four play on `PlayStage` at every width (the usual
`STAGE && phoneStage && !!g.t0 && (playing || !revealed)` mount), drawn from the approved
mockups. The old boards stay behind the stage untouched; every stage control calls the
board's own handler, so scoring, saves, posting, hints, share text, archives and the finish
are unchanged. None of the four is dealt into a run or circuit (checked `lib/circuits.js`
and every `RunEmbed` host), so there is no embedded mode to keep.

- **Chain** (End Game, gold): the box score (You / Them, the side to move on pale gold), the
  dots and boxes board drawn in board units and placed in percentages, sizes in `cqw` so it
  scales with the column (no turn-on-its-side on a phone any more: the mockup keeps 3 by 5
  across). Drawn edges ink, the last edge gold with an ink ring, open edges light grey, your
  boxes gold, the engine's light grey, open chains on a pale gold band with their count.
  Hint and Restart (two taps, `restartGame`) as tools; Give up is the foot (`revealEnd`).
- **Redact** (Trivia, orange): the title with ink blocks for hidden words, the article on a
  light grey sheet (scrolls inside itself), hidden words ink blocks (tap for the length),
  the last guess's words orange with an ink ring, misses after a give-up in `--pst-bad`.
  The guess history is one horizontally scrolling row. The study hold's Keep looking / See
  results are drawn on the stage (the old StudyBar sits under the overlay). Give up is a
  local two-tap `armGive` that calls the same `giveUp()` the confirm sheet calls.
- **Dating** (Trivia, orange): the five slots as cards with their place (1st ... 5th); a
  card a check confirmed is orange with its year. The mockup's "tap the next earliest" is
  carried as **tap a card, then tap where it goes**, which is `moveInsert()` (the desktop
  drag's move), so locks and checks behave exactly as before. Check my order is the one
  orange button. The check toast lost its em dash.
- **Stet** (Word, sky): one sentence at a time (`cur` is presentation only), pips for the
  brief (filed sky, showing ink), Back / Skip between sentences, filing a sentence moves on
  to the next open one. Tap a word (sky), type the fix, Fix it; or Stet: it is clean. The
  Sunday flow (stage up to two flags, Lock it in) is kept. A filed sentence shows the struck
  word with the fix beside it (sky when right, red when missed) and the desk's note.

**Shared bug worked around locally:** `StageTopBar`'s phone rule `.stb.has-t{flex:1 1 auto}`
(written for a row) makes the bar GROW VERTICALLY inside PlayStage's column whenever the board
is shorter than the screen, so the header sits 60 to 90px down the page. These four carry
`.pst-col > .stb.has-t{flex:none;}` in their own stage CSS; the right home for it is
PlayStage's CSS (every short PlayStage board on a phone has the same gap).
## The sudokus on the white stage: the shared SudokuStage, and Suds, Sixes, Sando, Mercury, Arrow, Frame, Rim (owner, 2026-10-31)

All nineteen sudokus move onto `PlayStage` from the approved periwinkle mockups (round 8, `<Name>.dc.html`),
through ONE shared module, `app/SudokuStage.jsx`, so they stay identical and only their variant marks
differ. The mount is the Numbers one plus `!EMBED`:
`STAGE && !EMBED && phoneStage && !!g.t0 && (playing || !revealed)`. **Enter the Dojo is untouched**: an
embedded sudoku (RunEmbed) never mounts the stage and keeps its old board and the run's plain look.
Presentation only: every control calls the client's own handler (cellClick, padTap, undo, eraseCell,
clearBoard, useHint, revealEnd, the long-press pencil), so scoring, saves, timers, hints, auto-move (the
original next-box logic), posting, share text, archives, Sunday Editions and the finish are unchanged,
and the old board stays behind the stage (`?stage=0` still shows it).

- **`SudokuStage`** = PlayStage + `SudokuBoard` + `SudokuPad` + `SudokuTools` + the one status line +
  the foot (Clock, How to play, two-tap Give up; the old in-page "Reveal & end" folds into it). The
  board is ONE SVG painted in CELL UNITS under a CSS grid of real buttons, layered base, fills,
  `under` marks, thin 1px `#8e9aab` separators, 2.2px ink region walls (drawn wherever `region(r,c)`
  changes, so boxes, jigsaw regions and 2x3 boxes are one rule), `over` marks, frame. Selected square
  full periwinkle, its row, column and region pale `#e0e7ff`; printed digits ink 800, player digits deep
  `#3949ab` 700; same digit elsewhere gets a ring; 3x3 notes. Outside clues sit in gutters measured in
  cells (`gutter`, `outside` chips: `.on` ringed for the selected line, `.done` grey, `.ok` full
  periwinkle, `.bad` red). Digit sizes are `cqw`, so the board scales with its column; its width is
  capped by the measured height (`lib/play-stage-fit.js` on `.sks-bd`). Pad keys are square, one row
  (Giant two rows of eight), count small in the corner (or "N left" under the digit on six keys);
  finished digits grey and struck. Tools: Notes, Auto-move, Undo, Erase, Clear (two taps, "Sure?"),
  Hint (first play only), icon over label. Usage notes for the other clients: the header comment of
  `app/SudokuStage.jsx`. SOLID strokes only.
- **`accentVars` knows periwinkle**: `--pst-pale #e0e7ff`, `--pst-deep #3949ab` (light) / `#a5b4fc`
  (dark, where player digits are the periwinkle on the near-black board). Board tokens per look
  (`--sks-base`, `--sks-thin`, `--sks-mark`, `--sks-mark2`) come from `useStageLook`; the
  black-and-white looks draw player digits in `--pst-mute`.
- **Per game:** Suds (classic) and Sixes (6x6, 3-wide 2-tall boxes, six "N left" keys) are the plain
  board. Mercury's thermometers are a light grey stem (0.34 of a square) and bulb (0.4) UNDER the grid
  lines. Arrow's arrows are a 2px grey ring, shaft and open chevron under the lines, and every digit
  carries a halo. Sando's eighteen sums sit top and left; Frame's thirty-six sums and Rim's printed
  triples (stacked top and bottom, in a row at the sides) on all four sides.
  **Deliberate difference from the mockups:** the old gutter readouts (Sando's +3 / 5 short / tick for a
  line with its 1 and 9 down, Frame's +/- and Rim's tick or cross for a filled triple) are not drawn in
  the gutter; a filled line that fails turns its chip red, and the readout for the SELECTED square's
  lines is said in the status line ("row 2: 3 short"), so no information was lost.

## Polka, Whittle, Towers, Knight, Diag and Window on the sudoku stage (owner, 2026-10-31)

All six play on the shared `SudokuStage` (app/SudokuStage.jsx) at every width, from the approved
periwinkle mockups (Polka/Whittle/Towers/Knight/Diag/Window.dc.html), with the Suds mount
(`STAGE && !EMBED && phoneStage && !!g.t0 && (playing || !revealed)`; Towers and Whittle have no
run embed, so no `!EMBED`). Presentation only: every control calls the client's own handler, the
old board stays behind the stage, and Enter the Dojo (Polka, Knight, Diag) keeps its own board.

- **Polka:** the dots are `over` marks ON the grid lines, r 0.15 of a square, 1.8px stroke: white
  disc with an ink ring, ink disc ringed in the page ink (so it still reads on the dark board).
- **Knight:** the eight knight squares of the selection are a deeper periwinkle (`--pst-acc` 55% on
  the board base, the mockup's #c7d2fe) with a small deep dot in the top-right corner; they win
  over the row / column / box pale.
- **Diag:** the two diagonals are faint deep-periwinkle lines under the grid lines, and a diagonal
  is a house, so its squares join the selection's pale peers (`peer`).
- **Window:** window squares are light grey at rest (the pale peer tint wins while lit), each window
  framed in periwinkle over the walls; window squares join the pale peers (a window is a house).
- **Towers:** one region (no box walls), peers are the row and column only, the border clues are
  gutter chips (0.66 of a square): ringed on the selected line, a full periwinkle circle once a
  finished line checks out (the old OK), red when it does not (the old OFF).
- **Whittle** (no pad, no Notes, no Undo): a standing clue is a pale square with a bold ink digit,
  a lifted one a faint grey digit on white; the pips over the board (lifted full periwinkle, can
  still come out pale, can never come out grey, the perfect pip ringed) and "N of M out"; "Tap a
  bold clue to take it out." under the board, then Hint and End here (the same two-tap `giveUp` as
  the foot's Give up, sharing its `armGive`). The line: "N clues standing · perfect is P · S slips".
  A slip still nudges the square (`whs-shake`).

## Five, Racecar, Sumo, Giant, Quilt and Cages on the sudoku stage (owner, 2026-10-31)

The six play on the shared `app/SudokuStage.jsx` (board, pad, tools, one status line on
`PlayStage`) with the same mount as Suds: `STAGE && !EMBED && phoneStage && !!g.t0 &&
(playing || !revealed)`. Presentation only: every control calls the client's own handlers, so
scoring, saves, hints, auto-move, posting, share text, archives, Sunday Editions and the finish are
unchanged; the old board stays behind the stage, and inside Enter the Dojo (Sumo, Quilt) the run
keeps the old board. The in-page Reveal is the foot's two-tap Give up. Variant marks, all solid:

- **Five / Racecar:** the lines from `PUZZLE.lines` under the thin rules, light green `#bbf7d0`
  (0.24 of a square) and light grey `#d5dbe3` (0.3). Dark look `#1d5a36` / `#3a4458`.
- **Sumo:** `thin={false}`; every in-box edge is `signPath(h, v, .17, .2)` in the thin-line grey
  (`--sks-thin`, 1.8px), bent at the smaller square; box walls stay straight ink.
- **Giant:** 16 by 16, symbols 1 to G (`glyph`), pad in two rows of eight. Under 560px the
  **Whole board / Zoom in** switch sits over the board (same `sot_giant_zoom` preference and
  `pickQuad` logic); zoomed, the stage draws the current 8x8 quarter as its own board (notes still
  run 1 to G through SudokuBoard's `noteN`) with a 46px quarter map beside the switch.
- **Quilt / Cages:** faint pastels (`SK_PASTEL`, nine), one per region / per cage colour
  (`CAGE_TINT`'s greedy colouring), the selection's peers a third of periwinkle over the pastel;
  dark looks sink the pastel to 22% on the board, the black-and-white looks drop it. Quilt's
  region walls are the board's ink walls. Cages: solid grey walls (`#5b6678`, 1.6px) between cages,
  left off where a box wall runs, and the totals in small white chips that grey once the cage is
  full; a chip square's digit sits a little lower (`.cg`). Cages' peers include its cage.

## The finish beat works on the white stage overlay, not the board behind it (owner report, 2026-11-01)

Owner: "the Carve end animation sits the box far above the actual puzzle". Every game on
`PlayStage` draws its board in a fixed `.pst` overlay while its pre-stage board stays mounted
behind it down the page, and `lib/finish-beat.js` found that hidden board, so the game's own beat
and the iris landed off the grid on all 71 PlayStage dailies. Now, when a `.pst:not(.inl)` overlay
is up: a def with a `stage` block (`{ board, cell, ... }`, merged over the def) plays its own beat
on the stage board; every other def plays the iris alone, opened from the stage column
(`.pst-top`). Carve is the first with a `stage` block (`.cvs-grid` / `.cvs-c`, Snap). To give
another game its own beat back on the stage, add its stage selectors the same way. Sudokus keep
their Turn over (`.sks-bd`), which runs after this step.

Carve's stage at the same time: the guide card under the board ("Block N holds ...") is gone, the
block chips sit under the board, and each block wears its own site pastel (`CARVE_PASTELS`, the
REGION_RAMP order without amber): full with dark ink when locked, a pale mix while it grows.

## Ink outlines are 1px sitewide (owner, 2026-11-02)

Every ink box line (`--dk`, `--mb`, and any literal `border: 2px solid var(--stg-ink...)`, `#08222e`,
`#0b0d12`, `currentColor` on chrome) is **1px**, shipped 352defabd across 30 files: the home (desktop and
phone looks, crowd strip top line, ledger, rail, Everything Else box), the puzzle-page chrome
(LayoutCInner, StageTopBar, StageFoot, HelpSheet), pop-ups (PremierePop, RunDoorPop, GateScreen,
MemeShare, LossHold), endings (StageStick, StageFinish), EntryDoor, the Stat Hub and the game 404 cards.
NOT changed on purpose: focus rings (`outline:2px` / `box-shadow 0 0 0 2px`), accent selection borders
(`--stg-acc-ink`), and in-game board lines (chain dashes, docket tiles, sudoku box edges, price bars).
New chrome takes `border:1px solid var(--stg-ink)` or `var(--dk)`; never reintroduce a 2px ink box.

## Mate, Queen, Defend, Swindle and Check on the white stage: the shared Slate board (owner, 2026-11-02)

The four chess dailies and Check (draughts) play on `PlayStage` at every width with the usual mount
(`STAGE && phoneStage && !!g.t0 && (playing || !revealed)`; none of the five is dealt into a run or
circuit, so there is no `!EMBED`), drawn from the approved End Game mockups (`Mate.dc.html` /
`MateDark.dc.html` and the same pairs for Queen, Defend, Swindle, Check). Presentation only: every
stage control calls the client's own handler (`onSquare`, `useHint`, `restartGame`, `revealEnd`), so
engines, tablebase, defence searches, scoring, saves, posting, share text, archives, Sunday Editions
and the finish are unchanged, and the old board stays behind the stage (`?stage=0` shows it; Swindle's
`SwBoard` still draws that one).

- **`app/SlateStage.jsx`** is the one shared board: `SlateBoard` (64 real buttons in a 2px frame, the
  host passes `cell(sq)` returning `{ piece, sel, last, target, hint, check, lift, live, label, onClick }`;
  `flipped` draws from Black's side for Defend; `coords={false}` for draughts; children render under the
  board inside the wrapper that carries the piece colours), `SlatePiece` (the mockups' piece drawings),
  `SlateMan` (Check's men), `SlateTools` (Hint + two-tap Restart) and `SLATE_CSS`. Its width is capped by
  the measured height (`lib/play-stage-fit.js` on `.slb-board`).
- **Colours.** Light look: squares `#f4f6f9` / `#d3dbe4`, 2px ink frame, white pieces white with an ink
  line, black pieces ink. Dark look (the Slate dark board): `#353d4f` / `#232a39`, frame `#5a6680`, white
  pieces `#fbfaf6` lined `#1a1d24`, black pieces `#1a1d24` with the `#c9d1de` rim. Picked square full End
  Game gold (`--pst-acc`, coordinates in its ink), last move the pale gold (`--pst-pale`), a legal empty
  square a small gold dot with an ink ring, a capture a gold ring, the hint a gold-and-ink inset ring, a
  checked king `--pst-bad` on `--pst-bad-bg`. Coordinates sit small inside the edge squares. The plain
  black-and-white looks swap the gold for a grey pick and ink dots (`slateVars`).
- **Per game.** Mate: "Mate the king in N moves." Queen: "Walk the pawn home to queen." (the mockup
  said "and mate"; the win is a safe promotion, so the copy says so). Defend: flipped board, "Survive N
  moves without being mated.", the "You play Black" pale gold tag. Swindle: "You are lost. Find the
  draw." with the four draw chips. Check: white men are yours, ink men Black's, a crown for a king, the
  Yours / Black / King legend; a piece that can move carries a faint ring while nothing is picked (the
  old board's lift ring, kept because captures are compulsory).
- **Deliberate differences.** The old "line so far" move chips and the meter segments are not on the
  stage (the mockups drop them; the last move is lit on the board and the foot line counts moves). The
  hint and Check's "no move" notices, which were toasts under the overlay, are said in the foot line.
  Restart stays two taps (it records a 0), as before.
## Four, Gift, Turn and Yose on the white stage (owner, 2026-11-02)

The four board End Game dailies play on `PlayStage` at every width with the usual
`STAGE && phoneStage && !!g.t0 && (playing || !revealed)` mount, drawn from the approved
Four / FourDark, Gift / GiftDark, Turn / TurnDark and Yose / YoseDark mockups. Presentation
only: every stage control calls the board's own handler (Four `drop`, Gift `onWell` /
`onChip` / `handOver`, Turn `onSquare`, Yose `onPoint` / `passTurn`, plus each game's
`useHint`, `restartGame` and `revealEnd`), so the engines, scoring, saves, timers, hints,
posting, share text, archives, Sunday Editions and the endings are unchanged, and each old
board stays behind the stage. None of the four is in a run or circuit (checked
`lib/circuits.js` and every RunEmbed host), so there is no embedded mode to keep. In-page
Give up folds into the foot's two taps; Restart stays a two-tap tool (`Tap again`).

- **Colours per look.** Each client reads the look with `useStageLook` and sets game-local
  `--frs-*` / `--gfs-*` / `--tns-*` / `--yos-*` on its board (and on its bottom controls
  through a wrapper column, since the bottom row is not inside the board). The
  neutrals are PlayStage tokens (`--pst-cell`, `--pst-pale`, `--pst-mute`, `--pst-acc`).
  End Game gold is `#e8b43a` with `#08222e` ink on it. The plain black-and-white looks keep
  every board colourless (gold becomes ink or grey; Four's discs go light with an ink dot).
- **Four:** your discs gold with a 2px ink edge, the engine's solid ink (its last disc
  carries a small light dot), empty holes white with a `#9aa5b8` rim on a light grey well;
  dark: a `#6f7b90` slate well with `#c9d1de` holes. A tap PICKS a column (gold ring, the
  disc waits above it); a second tap or **Drop in column N** drops it. A mouse picks on hover,
  so a desktop click drops in one go. Legend "You, gold" / "Engine, black".
- **Gift:** the gift in a pale gold card, the round board of sixteen white wells (`#9aa5b8`
  rims), the pieces still to give in a grey tray, all pieces drawn as SVG (`GfsPiece`): dark
  pieces ink (dark look: `#1a1d24` with a `#c9d1de` rim), light pieces white, hollows grey.
  One gold button walks two stage-only steps: **Place it in well N**, then tap a piece and
  **Hand it over** (`handOver`), with **Back** to return to step 1. The last well skips step 2.
- **Turn:** the score cards (side to move on pale gold), the 8 by 8 board on light grey with
  `#9aa5b8` grid lines (dark: `#353d4f` squares on `#232a39`), your discs black and the
  engine's white, legal squares a gold dot, the last disc ringed gold, the hint ring ink.
- **Yose:** the warm paper board (`#f6f1e7`, dark `#1d2638`) with ink grid lines at .45,
  your stones black and White's white, settled territory as small squares, open points as
  gold dots, White's last stone ringed gold; Hint, Pass (two taps, `passTurn`) and Restart.
  The captured-stone mark is a thin solid ring (the old board's was dashed).
- **Fit:** each board's width is capped by `lib/play-stage-fit.js` (Four from its 7 by 6
  aspect), so 390x844 and the Sundays (Turn's 12 empties, Yose's 9x9) fit without scrolling.
- **`usePlayStageFit` cannot see a `display:contents` child** (its box is 0px tall, and
  `natural()` takes the smaller of box and contents), so a bottom row wrapped that way is
  left out of the sum and the board overflows. Wrap stage controls in a real flex column.

## The End Game boards fill the desktop: the board beside a rail (owner, 2026-11-02)

Owner: "can we make the boards a bit bigger to fill the space? mobile should be unchanged if it
already fills the space." Applies to the nine End Game boards above (Mate, Queen, Defend, Swindle,
Check, Four, Gift, Turn, Yose). In the 520px column the board was capped near 490px (chess, height
and width both), and Four ~350-410, Gift 320-400, Turn and Yose 440 by their own caps; at 1280x800
there was no height left to grow into, so widening the column alone could not help.

- **From 900px wide (`useEgDesk()`, the same line as PlayStage's phone/desktop split) the board
  stands on the left and a rail beside it** (`EgDesk` + `EgRail` + `EGD_CSS` in
  `app/SlateStage.jsx`): eyebrow, brief, the game's own rows (Swindle's chips, Defend's tag,
  Check's / Four's / Yose's legend, Turn's score cards, Gift's gift card, label and tray), the
  go button and tools, then the foot line. The host passes PlayStage `wide` and `full` only in
  that mode, so the top bar spans the Full view width. The foot row (Clock, How to play, Give up)
  stays under everything. `SlateBoard` takes `desk` and `rail={{ eb, q, above, tools, foot }}`;
  the four board clients build the same pieces as consts and choose the tree.
- **Phones (under 900px) take the old tree, unchanged** (same elements, same caps, same fit).
- **Fit:** `usePlayStageFit(ref, sel, on, beside)` gained an opt-in fourth argument. With it, the
  hook walks every wrapper from the board up to `.pst-col` and counts only siblings stacked above
  or below the path (the rail shares the board's rows, so it costs no height); inline (desktop
  with the site navigation, 900-1279px by default) it fits the window below the stage's top edge
  instead of returning null, and `.pst.inl .pst-col:has(.egd)` drops the inline min-height, so
  Give up is on screen at 1024x768 without scrolling. Without the argument the hook is unchanged
  for every other game.
- **Line weights grow with the board, never below the phone's:** Slate frame `--slb-fw`
  (w/230, min 2px), marks and rims `max(<phone px>, k·cqw)` inside the board container; Four's
  gap, pad, frame, hole rims and pick ring scale by `s0` (cell/48); Gift, Turn and Yose scale
  their rims, grid lines and rings by `--gfs-s` / `--tns-s` / `--yos-s` (fit/400 or fit/440,
  capped 1.8-1.9), set only on the desktop path. Yose's legend pins `--yos-s:1`.
- **Column width:** Full view's 1180px at 1000-1499px; past 1500px `EGD_CSS` lets the column
  reach 1400px (`.pst.full:not(.inl) .pst-col:has(.egd)`), or a 1920x1080 board stops at ~746px
  with 180px of height unused.
- Measured 2026-11-02, light and dark, board width (Four: well width): 1280x800 676 (was chess 492,
  Four 408, Gift 320, Turn/Yose 440); 1440x900 750; 1600x900 776; 1920x1080 956 (Four 953; was
  492 / 440 / 400 / 440); inline 1024x768 503 (Four 499) with Give up on screen (it was below the
  fold before). Phones 390x844, 375x667, 430x932 measure exactly as before. Known and unchanged:
  at 375x667 Four (26px) and Gift (56px) still overflow the stage, as on origin, because the
  board sits at the hook's 260px floor.

## Where You Stand: puzzle, category and day standings on every ending (owner, 2026-11-03)

Approved on the "Standings Ending Mockups" canvas. `app/WhereYouStand.jsx` holds all of it: the
data hooks (`usePuzzleStandings`, `useRunStandings`), the imperative beat (`beatHtml` + `playBeat`,
shared with RunFinale), `StandBeat`, `StandCard` (three tabs + the chosen board) and `StandRows`.

- **Three rows:** this puzzle (or run), the category today (`<Cat> Puzzles Today`; the five multiple
  choice runs use **MC Runs** from `/api/quiz/multiple-choice`, owner's name for it), All Puzzles Today.
  Category and day count from the rank held BEFORE this finish and show an `Up N` chip.
- **Puzzle ending, phone (StageRoll):** the second beat is the three ranks when they are in; the old
  stats beat (field, against yourself, board) moves to the result bar's dropdown. The final view leads
  with StandCard. The message beat waits for the standings at most `STAND_WAIT_MS` (2.6s); later
  standings skip the beat and only fill the card.
- **Puzzle ending, desktop (StageStick):** the beat plays on the full-screen colour under the result
  (the cover's field/against-yourself block hides while it plays) and the colour holds until it ends.
  On the sheet the band's "Today's field" becomes StandRows, and the board's scope switch gains the
  category and All Puzzles beside Today / All time.
- **Runs:** RunFinale part three (after the title lands, before the glide): the piece folds away and
  the beat plays. `getStand()` must answer within 1.5s or part three is skipped. On the end page
  StandCard takes today's board slot (desktop) and sits under the bar (RunRoll). GauntletEndStage
  takes `runId` (each run client passes it; RunClient only off practice); `finale.key` stands in.
- **Cost rule.** Puzzle endings read `/api/quiz/daily-combined` (day, and `keys=` for the category)
  WITHOUT fresh=1, with `less=<game>&plus=<ladder points>`. The route's `stand` block answers
  `rank` / `before` (without the `less` games) / `plus` (with the finish added when its row is not in
  the shared memoized read yet) plus `top` and the neighbours. `have` says whether the game was in
  the read; the client picks `rank`+`before` if so, else `plus`+`rank`. Do not add fresh=1 to puzzle
  endings: that recomputes the whole day per finish. Run endings (far rarer) do read fresh=1.
- Today only: an archive replay passes no `standing`. Sudokus land ranks whole (no counting).

### Where You Stand, round two: in the bar, Who's Next to Pass, GIF rail (owner, 2026-11-03)

Approved on the canvas as B2 (phone) and "GIFs in the right rail" (desktop), plus the full phone
sequence ("Phone · Full sequence").

- **Names:** the day scope is **All** (never "Today", which read as today's puzzle); labels are
  `All Puzzles`, `<Cat> Puzzles`, `MC Runs`.
- **Phone (StageRoll):** message, then the standings beat, then everything rolls into the ONE top
  bar, which keeps the three ranks as chips (`.srl-chip2`). Tapping the bar opens Where You Stand
  (StandCard) above the old dropdown contents. The final view is: `PassCard` (Who's Next to Pass:
  All, category, this puzzle; gap to the named player just above), `PassPlay` (the big "Play <easiest>"
  button plus two small ones: the category's easiest pick and Challenge, which scrolls to the GIFs),
  the Challenge tray with THREE GIFS STACKED VERTICALLY (owner: never a side scroller on phones),
  then Play next.
- **Desktop (StageStick):** the pass card spans the sheet under the band with PassPlay beside it.
  With the side rail present, the rail is "Send a GIF" (challenge + the three GIFs) and the sheet's
  challenge slot lists **Easiest Points Left**; Keep playing stays in the sheet. The band is back to
  Today's field + Against yourself.
- **The three GIFs** (`MemeStack` / `memePicks` in app/MemeShare.jsx): the result meme, the
  STANDING meme (caption "#19 of 893 today. Up 6 with Crux."), and Good luck (Your move if the
  result meme already is Good luck). A tapped GIF opens the share sheet on that GIF and caption
  (`MemeShare pick`).
- **Easiest points** (`stand.picks` in /api/quiz/daily-combined, only when `less`/`plus` is sent):
  unplayed games today with 3+ plays, half or more finishing, a typical finish clock of 10 minutes
  or less; expected points = the ladder at the middle of today's named field; ranked on points per
  minute; `after` = the rank those points would buy. The client drops run parts and anything played.
- Runs keep the standings beat and card (renamed to All); B2 and the GIF rail are puzzle endings only.

## The quieter desktop home (owner, 2026-11-05)

Ten cleanups to the desktop home, all inside `@media (min-width:901px)` in `app/today/StageToday.jsx`
unless noted. The phone is untouched.

- **Quiz runs stand in for their games on All Puzzles.** `FOLD_RUNS` (gauntlet, triviaencore, science,
  english) each get a tile at the head of the grid, and the games inside them leave the grid
  (`foldKeys`). Tile view only, never while searching; category panes, skills and List view still list
  every game. Run tiles wear their main category's strip (`runCatOf`, `.sty-grunc`), with short tags in
  `RUN_TAGS`.
- **Colour arrives as puzzles are played** (the home's guiding idea). Index rows are flat white with a
  faint ink hairline (20% ink; no category dot, no coloured outline in dark), filling left to right with the category pastel
  as games are played (`--ixf`). The cap strip's empty
  pieces are neutral grey. The rail has no colour key or colour bar.
- **No "one life" on tiles.** Dropped from every `tag` in `lib/daily-games.js` and `app/DailyEndCard.jsx`
  (`tagLong` and How to play still explain it).
- **The group lives in the rail.** The cap's group figure is hidden; the rail's group box head reads
  "You #N of M" (links to the group page). The group chip is a plain text toggle with no count.
- **Every toggle is text with the choice underlined** (Tiles/List, sort, Categories/Skills, the group,
  the rail tabs). Solid black is reserved for the open pane's block.
- **Tile strips** show the bare play count in bold (no "today", and no "Plays today" label: owner
  removed it 2026-11-05), the leader's name in regular weight.
- **Stars:** once a reader has starred any game (`.fav1` on the root), empty stars show only on hover.
- **The rail has one shape:** Your challenges is one line (`app/ChallengeBack.jsx`), Top Five Runs is its
  own box.
- **Puzzle-page frame matches** (`app/LayoutCInner.jsx`): flat index rows with a hairline, `k of n` counts
  and the played fill; underlined Categories/Skills and panel tabs; neutral empty strip pieces; the cap's
  group figure hidden (the panel's Group tab carries it).

## Desktop ending, direction C (owner, 2026-11-05)

`app/StageStick.jsx`, desktop only (the phone's rolling ending is untouched):
- **Slim band** (`bandC`, `.sst-hc`): eyebrow, verdict and the metric on one line; the three Where You
  Stand boxes in a row (chip + rank, who is next, a thin bar); Replay, Back to board and the archive as
  text links at the right.
- **Who's Next to Pass leads the sheet** (`nextC`, `.sst-nc`; the sheet fills the content area, `fitWide`, and today's board + group sit under the picks in the left column): one big next play (head line, Play
  <game>, description, minutes and finish rate; +pts, the rank move and a Start button), then six more
  picks in two columns; the run link, the challenge and the GIF beside it. Falls back to the older
  layout when there are no standings (guest, no data).
- **The right rail folds away** while the ending is up: a `.sst-fold` marker is portalled into
  `.lc-side`, which hides it and narrows the host's right padding; the sheet widens to 1500px.

## Chomp, Etch, Impound, Junkyard, Parker, Jesters and Judges on the white stage; Carve's full pastels (owner, 2026-11-06)

All seven play on `PlayStage` at every width with the usual mount
(`STAGE && phoneStage && !!g.t0 && (playing || !revealed)`), drawn from the "Unchanged Puzzles on
the Stage" canvas after its pastel pass. Presentation only: every control calls the board's own
handler, the old board stays behind the stage untouched, and the in-page Reveal / Give up is the
foot's two-tap Give up. Logic wrong marks are orange (`--lg-bad`).

**THE PASTEL RULING (owner, 2026-11-06): no washed tints for regions or pieces.** Courts, blocks
and carved regions wear the FULL site pastel (`regionHue(k).dk`), never a color-mix wash or a
#ffe4e6-style pale fill; a picked piece keeps its pastel and gains the ink ring. Plain squares stay
white or `--pst-cell` grey.

- **Chomp:** cast rail (eaten faded with a rose tick, next ink-ringed), grey field, trail squares
  full rose, the gator in rose with an ink casing (geometry from `chompTrail` / `chompHead` /
  `chompGator`, shared with the page board). Bleachers are solid ink with two bench bars. D-pad
  (`holdProps`), Restart / Try again two-tap, foot Give up calls `giveUp`. No swipe (the client has
  none since 2026-08-08).
- **Etch:** one grid with clue strips top and left (the aimed line's strips full rose, finished lines
  struck through), filled squares rose, marks grey with an ink x, a solid heavier rule every five.
  Clue gutters are sized from the clues' digits, not their count. 20x20 fits at 15px squares.
  Commit-on-lift and hold-to-aim are the board's own (`data-i` on every square).
- **Impound, Junkyard, Parker** (one shared look, `JX_CSS` + `JX_FLEET` duplicated per client): white
  lot on grey squares, exit gap with an ink chevron, your block full rose with an arrow, every other
  block a full pastel keyed on its index (never rose), landing squares white with a rose edge.
  Taps go to each client's `onCell`.
- **Jesters, Judges:** each court its full pastel (`COURT_SLOTS`, the same slots as the live board),
  3px ink walls, seats solid ink with the glyph in the page colour, court chips (pastel, heavier
  edge half full, ink when full, orange when over). Fitted by `usePlayStageFit`.
- **Carve:** a block wears its full pastel from its first square, growing or locked (the 30% / 52%
  mixes are gone); chips are always their block's full pastel, the block being grown has the ink
  ring, a locked block's chip shows a tick.
- **Finish beats:** `lib/finish-beats.js` gained `stage` blocks for park / impound / junkyard
  (`.jx-lot`, `.jx-blk`), jester / judges (`.jsx-bd`, `.jsx-c`, seat = class `s`) and etch
  (`.ets-grid`, filled = class `f`). Chomp has no beat def and plays the iris.

## The site pastel is the 60/40 step, not the raw ramp (owner, 2026-11-07)

"Why doesn't this use our pastels?" The pastel a reader sees on the home tiles is the ramp step mixed
60/40 with white on the light page (sky #7dd3fc reads #b1e5fd, rose #fb7185 reads #fdaab6, mint
#a8f1d4, periwinkle #c9d2fd); only the dark page wears the raw step. Boards that painted regions or
pieces in the raw step on the white stage read too bright. Every multi-colour fill on the stage goes
through `sitePastel(hex, dark)` (CSS color-mix) or `sitePastelHex(hex)` (canvas) in
lib/category-ramp.js. Applied to Jesters and Judges courts, the Impound / Junkyard / Parker fleet,
Carve's blocks and chips, and Blocks' light-look pieces (superseding its "same in both registers"
rule). Shards and Sweep already used the soft step. Connect keeps the raw step on its route lines
(its cells are already drawn at 42% opacity), and the stage's single accent (--pst-acc) is unchanged.

## Retention ending C: Up next, the path and Your Day (owner, 2026-11-07)

Approved on the "Retention Ending Mockups" canvas (Desktop C / Phone C, "a mix of the two"). Replaces
direction C's Who's Next to Pass card, its sibling strip and six-pick grid, and the phone's PassCard +
PassPlay. All of it is `app/EndNext.jsx` (`EndNext`, `EndDay`, `StandChips`, `buildStops`).

- **Up next:** one big next play (the first stop) and a Start button. On a FRESH finish (`pageAge() >=
  BEAT_FRESH`), once the ending has settled (desktop `phase === 'inline'`, phone StageRoll `phase >= 2`),
  Start fills over 8 seconds and opens the game by itself. Any pointerdown, key, wheel, touch or tab
  switch cancels it, as does "Stay here". Never on `?p=` archive replays or with reduced motion.
- **Then:** the next stops (up to three more) with minutes, points and the rank in All Puzzles after
  each, priced from `stand.above` / `stand.aboveN` (daily-combined: the nearest 300 day totals above the
  reader, ascending, and the count of all of them). WYS `pointsRow` carries them as `ladder` / `ladderN`
  plus `total` and `games`.
- **Keep going after each** (a switch, on by default) stores the path in localStorage `sot_path`
  (`{ d: ET day, keys, on }`). An ending whose game is on today's stored path continues it; any other
  ending builds a fresh path from the easiest picks (`ranked`).
- **Your Day:** goal ring (`played/(played + k)`, "k more for Top N in All", N the nearest of 500, 200,
  100, 50, 20, 10, 5, 3, 1 above the reader that the path reaches), the site-wide streak from
  daily-status, "New puzzles in h:mm" (ET midnight) with **Remind me**, which downloads `/remind`, a
  static daily 8am calendar event (.ics), and a group nudge when members of the reader's lead group
  have not played (share sheet on touch, else the group link copied).
- **Band (desktop):** the three standings are chips (`StandChips`), not boxes with a pass line each.
- **Challenge:** `MemeStack limit={1}` shows one GIF with "N more GIFs" behind a button, desktop and phone.
- Desktop layout: left column Up next, Then, today's board + group, Keep playing; right column Your
  Day, the run, the challenge. With no picks (archive replay, guest with no standings) the older layout
  stands.

## The desktop home is ONE ROW at the top (owner, 2026-11-07)

The cap's status strip (the per-category split strip) is gone on desktop, and the
open pane's control row (Tiles / List, the group chips on All Puzzles, search,
sort) moved up into the cap. The cap is a grid of the page's own columns:
212px (logo, date under it) | 1fr (`.sty-captools`, over the tiles) | auto
(figures, name, look switch). The pane's `.sty-cathead` is hidden on desktop for
All Puzzles and the category / skill panes, since the cap now carries it.

The search (`capFind`) FILLS whatever the row has spare (flex 1, 40px floor). It
only expands when that is too little: `.sty-captools` is a size container, and
under 680px wide, focus or a held query hides the sort so the box takes its
width. Below 1280px the sort reads "Easy" for "Easy to Hard" and gaps tighten.
Esc clears the box. Other panes (Runs, Quizzes, boards) leave the middle empty.

## Details is the default view; the rail needs a real desk (owner, 2026-11-07)

**The crowd on every Details card (owner, 2026-11-08).** The desktop Details card carries the usual
crowd strip (#1 leader, plays today). The PHONE Details card (`.mph-gg.det .mph-g`) now carries the
same strip along its foot (`.mcs`): the leader or "No solve yet" / "Open. Be first.", and "N playing"
even at zero, read from the same `boardBy` the desktop uses.

Approved on the "Mind Loft Home: Details Toggle and Rail Breakpoints" canvas.

- **Tiles · Details · List.** The desktop view toggle (cap and pane heads, `viewCtl`) has a third
  setting, Details: bigger tiles (`.sty-ix.sty-det`, `minmax(270px,1fr)`, three across at 1440
  with the rail) carrying `fullDesc(g)` (the game's `how` text, whole sentences up to ~240
  characters, never an ellipsis) and its skills (`skillLine`, from `SKILL_TAGS`), above the
  usual crowd strip. Fitted rows (`fitFor`) are off in Details; rows size to their text.
- **Details is the default for every pane and every player.** The stored choice moved to
  `sot_home_view2` (`VIEW_KEY`), so older Tiles / List picks start over on Details; any pick made
  now holds. A skill pane opens in Tiles only if that is the stored pick, else Details.
- **The one-time note is RETIRED (owner, 2026-11-12).** It was gated per browser
  (`sot_det_hint` + `seenBeforeToday()`), not by date, so any browser on its second day, or one
  that adopted an id at sign-in, kept getting "New: Details" on its first desktop load long after
  the switch. The state, effect, markup and CSS are gone; do not bring it back.
- **Details leads the toggle (owner, 2026-11-12).** Order is Details · Tiles · List on desktop and
  Details | Tiles on the phone, and Details stays the default for every pane.
- **The rail shows only at 1280px and up with a mouse or trackpad**
  (`RAIL_MQ` = `(min-width:1280px) and (hover:hover) and (pointer:fine)`, mirrored in the CSS
  rule that lays out `.sty-ix.rl`). Every iPad, landscape included, and every phone drops it; its
  boards stay in Leaderboards + Stats.
- **The phone (900px and down) has it too (owner, same evening: "1 across").** Each phone pane
  gets a "View: Tiles | Details" row under the sort (`.mph-vw`; List stays desktop-only, so a
  stored List reads as Details there). Details tiles (`.mph-gg.det`) are one across on a portrait
  phone and two across from 600px (iPad portrait, a phone turned sideways), with `fullDesc` and
  the skills.

## The Space Cadet pop-up (owner, 2026-11-07)

`app/SpaceCadetPop.jsx`, mounted in StageToday next to GroupsPop (home only). "Are you a Space
Cadet? Take the new test!" with one line on the run, a full-width "Take the Test" to /spacecadet, a
Close link and the X. No per-puzzle tiles (owner). Shown to EVERYONE, new players included, ONCE
per browser: `sot_pop_spacecadet` is stamped when it renders; a browser with any
`sot_run_spacecadet_*` save is stamped and skipped. Never while a puzzle is being played
(`gameActive()`), and it waits while the entry door or any other card or the Details note is up;
if the way is not clear within 30s it gives up for that visit without stamping.
`?spacecadet=0` suppresses, `?spacecadet=1` previews without stamping.

## The Details card: board band, glyph and fact chips (owner, 2026-11-08)

Option E from the Details card mockup. In the Details view every puzzle card carries:

- **A board band across the top** drawn by `app/GamePreview.jsx`: a small sketch of the game's board in three steps of ONE colour (`--gpd` deep = the category ink, `--gpm` mid = its pastel, `--gpw` = the surface). Never a second hue, never greys. It draws nothing from the day's board, so it cannot leak an answer.
- **The game's glyph beside its name**, in the deep step.
- **A facts row** from `lib/game-facts.js`: up to three chips the game states about itself (count from its tagLong/How to play, "Ns each", "1 life", Counts tries/errors, Sunday Edition; never a bare "Timed", since every daily is timed) plus the week's difficulty (five bars and the tier word from `/api/quiz/difficulty`). A chip never states a number the game's own text does not.

**Board on the left, not a band (owner, 2026-11-08: option B, "for here and desktop").** The band across the top left too much dead space. On both the desktop and phone Details cards the drawing is now a 74px square tile at the top left (`<GamePreview square />`), with the name, the facts and the skills beside it and the description full width below; the crowd strip stays along the foot. Both cards are CSS grids (areas `b n / b r / b f / b k / x x / y y / s s` on desktop, `g n / g f / g k / g p / x x / y y / s s` on the phone; only the spacer row `y` is `1fr`, since two fr rows inflate every card). A played phone card still folds. The phone Details card no longer prints a bare "Play" (the whole card is the way in); a result or Resume still shows.

**Square mode crops each drawing to its own bounds** (measured with getBBox before paint, and again via ResizeObserver if the card mounted hidden). **One drawing per puzzle (owner, 2026-11-08: "This reuses far too many for similar puzzles and many that aren't").** Every daily outside the sudoku family has its own square drawing in `app/GamePreviewTiles.jsx` (`TILE_BY_KEY`), showing what that game asks you to do: a ball for Sport, a clapperboard for Script, a bracket for Bracket, a car, house, plane and handbag for the Price Check games, three different lot sizes for Parker, Impound and Junkyard, and so on. The sudokus keep `Grid` with their own variant marks (Towers draws towers, Frame two-digit sums, Rim stacked triples, Cages and Polka print no digits); a color twin or 6x6 twin reads as its parent's family on purpose. **A new daily gets its own entry in `TILE_BY_KEY`; never point it at another game's drawing.** The category fallbacks (`QuizSq`, `TilesSq`, `PriceSq`) exist only so an unlisted game still renders. Check a new drawing in a 74px tile.

**Drawing hygiene (2026-11-09 sweep of every tile).** Nothing in a drawing touches or crosses anything else: a line, bulb, arrow or diagonal never sits on a printed digit or a colour square (`Grid` keeps an `occ` set of the cells each variant draws through, and givens and colour squares skip them; the diagonal sudoku has its own givens off both diagonals), text stays inside its box (Origin, Ergo), clue numbers never collide with letters (Glyph), lines stop at the frame instead of capping past it (Plot), a mark sits in the cell it marks (Queen), the photo-tile line stays inside its tile (Swap, Spin), Calc links its tiles in the gaps instead of drawing over them, and 9x9 Cages prints no sums (a 6px cell cannot hold one; the 6x6 twin keeps them). The square crop is `max(w, h) * 1.14 + 7` so strokes clear the tile's rounded border. Check a new drawing at 2x with its neighbours before shipping.

**At most two chips, one line tall (owner, 2026-11-08: "They should all be uniform height, max two tags").** `FactRow` shows the game's first fact plus the week's difficulty (or its second fact when there is no tier). The chip row is fixed at 24px and wraps into hidden overflow, so a chip that will not fit the line drops out instead of adding a row; the phone skills line is one line with an ellipsis. Every Details card's top block is the same height as its tile. No "Counts errors" chip ("a dumb tag to begin with").

**No glyph by the name on a Details card (owner, same evening: "the glyphs aren't needed if we have these").** The drawing does that job; Tiles and List keep their glyphs and dots.

**A new daily gets its own drawing:** add its key to `BY_KEY` in `app/GamePreview.jsx`. Without one it falls back to its category's shared shape (sudoku grid, quiz card, chess strip, tiles of its name...), which renders but says less.

## Home pop-ups wait for the snapshot, and a scrim closes only on its own press (2026-11-08)

Owner report: the sudoku launch card "showed, but only for one second". Cause: on a returning
visit the home paints its last-known snapshot (`lib/home-snapshot.js`) over the live page, and the
live page (where PremierePop, GroupsPop and SpaceCadetPop mount) sits at opacity 0 with
pointer-events off until every read lands (up to 9s). PremierePop opened under it, stamped itself
seen, and stayed invisible. The reader's first tap released the snapshot, the card appeared, and
that same tap's click landed on the scrim and closed it.

- **Any pop-up mounted inside the home waits while `html[data-sot-snap]` is set**, the same way it
  waits for the entry door. PremierePop's `arrivalBusy`, GroupsPop's `busy` and SpaceCadetPop's poll
  all check it.
- **Scrims close through `scrimClose(close)`** (exported from `app/PremierePop.jsx`): it closes only
  when the press STARTED on the scrim, so the tail of a tap that began before the card was on screen
  can never dismiss it.


## One-line clipped text must not cut off descenders (owner, 2026-11-09)

Any text clipped to one line (`white-space:nowrap; overflow:hidden`, usually with an ellipsis)
clips at its line box, and at a line-height under about 1.25 that box ends above the tail of
g, j, p, q and y. The run tile names ("Gauntlet", "Judged") shipped that way. Two accepted fixes:
raise the line-height to 1.35 (`.tdy-hd h2`), or, where the block height must not move, grow the
clip box and hand the space back: `padding-bottom:.2em; margin-bottom:-.2em` (or fold the .2em
into an existing margin with `calc()`). Before shipping a clipped line, check it with a word that
has a descender. Swept 2026-11-09: `.rgt-name`, `.rgt-hl`, `.wys-n b`, `.gsx-bt`, `.sst-tile b`,
`.nt-rel-t`.

## The ending's first screen: three big plays, Full Results behind a button (owner, 2026-11-11)

Owner on Retention ending C four days after it shipped: "these end screens suck ... clean them up,
keep people playing". Approved on the "Clean Ending Mockups" canvas (the combined B + A row). Every
daily ending now LANDS on `app/EndFirst.jsx`, on the full category pastel, desktop and phone, and
stays there until the reader chooses something:

- **Result:** eyebrow, verdict and the key figure, centred.
- **Three pills:** this puzzle's rank (a button: today's leaderboard opens in place on a desktop,
  as a bottom sheet on a phone, from `sheet.allTop` plus the reader's own rows), the group standing
  (`groupStandingOf`, the same read the phone result bar makes), and **Today's Puzzles: #N of M**
  with its Up chip. NO streak anywhere on the ending ("i dont care about streak"); EndDay's streak
  row is gone too.
- **Three big plays, in this order:** Play Similar (the closest relative, else the nearest pick in
  the category, else the `similar` prop), the RUN IN THE MIDDLE ("put the Run in the middle":
  `run` from StageFinish reads Your Run / Finish the <run>; otherwise Start a Run offers a run from
  DISPLAY_CIRCUITS not finished today, one that deals this category first), and Switch Gears (the
  easiest pick from ANOTHER category, else the most played unplayed game outside it). Each says
  category or size, typical minutes and "N played today" (`/api/quiz/pulse`, now read on a phone
  too). No "passes <name>" lines here: the owner found them confusing.
- **Three quiet buttons:** Challenge (Win $500; `chal.onSend`), **Full Results Page**, All puzzles.
- Replay, Show board and the archive are plain buttons at the top. On a phone the replay games'
  `retry` offer is a full-width Replay instantly above the plays.

**Full Results Page is the ending as it was.** Desktop: the colour pulls back onto the band
(`retract`) and the direction C sheet is the page; the band's "Close Full Results" puts the colour
back (`setPhase('show')`). Phone: StageRoll mounts with `settled`, so it lands on its final view
without replaying its beats. The colour NO LONGER pulls back by itself, and Escape or a background
tap only finishes the reveal.

**Nothing starts by itself any more.** EndNext's 8 second auto-start is off on both widths
(`armed={false}`): the first screen is a choice, and a page opened on request must not leave.

**The day board is called "Today's Puzzles"** on every ending surface (StandChips, the standings
beat and card, PassCard, Up next, Your Day). This supersedes the 2026-11-03 "All, not Today" rule
above. The desktop cover is centred again, superseding the 2026-10-31 left-aligned cover.

Not built: the short hand-off beat between games from the same canvas (the owner did not rule on
it), and a way back to the first screen from the phone's Full Results Page.

## Up next is one element of three boxes (owner, 2026-11-12)

Owner on the Full Results Page's Up next card and Then strip: "I dont think that these '+12' #5 #4
have much meaning to lay user. let's combine the elements in the picture into one 3 box element for
the three puzzles. no need to say + or # in them, just the title, short descript. and tags (hard,
gentle, etc), and time to finish". `EndNext` in `app/EndNext.jsx` is now an "Up next" label over ONE
row of three equal boxes (the first three stops), desktop and phone (stacked on a phone and under a
620px container):

- Each box: the game glyph, the name, the short description (`tag` from `DAILY_GAME_MAP`, else the
  category), then two tags: the week's difficulty band (Gentle / Moderate / Tough, `tierOf` over
  `/api/quiz/difficulty`, one shared read) and the typical minutes.
- NO points ("+12"), NO ranks or rank moves ("#5 to #4"), NO "passes <name>" line, NO "% finish".
- Gone: the big Up next card, its Start button (and the dormant 8 second auto-start code), the Then
  strip, the "Keep going after each" switch and the stored path (`sot_path`). The boxes are plain links.
- **The three are the MOST SIMILAR puzzles** (owner, same day, on Sworn offered after Blocks: "sworn
  is NOTHING like blocks. that is terrible matching. this list should be most similar"). StageStick's
  `simRanked` orders EVERY open puzzle today (not only the server's easiest-points picks): the game's
  family first (`relativesOf`, family order), then its category, then shared skills; pick ease and
  today's plays break ties. Run parts stay out, as does a non-family puzzle whose typical solve runs
  past 15 minutes. It needs no standings, so Up next shows before they land and for a reader with none.
- **The desktop sheet's top edge is level with the left navigation's** (`.stg-hosting .sst-page.sst-pc`
  pulls up 14px over the stage slot's 24px of padding, landing on the nav's 10px).
- `buildStops` still prices each stop (`pts`, `rank`) because Your Day's goal ring reads the ranks.
  EndNext accepts and ignores the old `from`, `passName` and `armed` props.

This supersedes the Up next, Then and Keep going bullets of "Retention ending C" (2026-11-07) above.

## Category page sort and filter bar (owner, 2026-11-10)

`app/puzzle-category/CategoryLanding.jsx`, whole-category pages only (not set or subset pages),
and the matching home panes in `app/today/StageToday.jsx` (owner, 2026-11-10: "needs to be an option
on main page too"). Both read `lib/category-kinds.js`.
Owner cut the first mockup down: one or two controls per page, never a wall of chips.

- **Sudoku:** one Both / Numbers / Color toggle (no size chips). The grid size LEADS each row's
  generic line (`9x9 Killer sudoku`), from `SUDOKU_SIZE` in `lib/colour-sudoku.js`; a trailing
  size in the generic label is stripped so it never prints twice. Towers reads `5x5 and 7x7`.
  Sort adds Smallest First / Largest First.
- **Logic, Visual, Table Games and Word:** one Kind row of three or four (Visual and Table Games added
  2026-11-12, when Logic dropped to three), multi-select, folded from the category sets
  (`KIND_OF_SET` in `lib/category-kinds.js`). A NEW SET in `lib/daily-groups.js` for Logic or Word must be
  added to `KIND_OF_SET`, or its games only show with the Kind row on All.
- **Sort on all three:** Featured (default, the set shelves as before), Most Played Today
  (today's play counts; reorders only when picked, so nothing moves on load), A to Z. Any sort
  but Featured shows one flat list.
- **Phone:** the Kind row is one line that flick-scrolls sideways with NO visible scroll bar
  (owner, 2026-11-10).
- **Home panes:** the Sudoku, Logic and Word panes get the same toggle / Kind chips beside the
  search in the desktop cap (`catChips`) and as a flick row under the phone header (`.mph-cf`).
  Sudoku adds Smallest First / Largest First to the home sort; those two are never stored, so the
  next pane returns to the reader's stored sort. Filters reset on every pane change.

## The coherence pass: one grammar per surface on the desktop home (owner, 2026-11-10)

Owner, on five mockups: "I like all of these, implement. go with 5A". Each surface of the home now
says a thing ONE way. Keep it that way when adding to any of them.

- **Details card** (`GameCard` in `app/today/StageToday.jsx`): board tile, name, at most two chips
  (first fact, then the week's difficulty), a blurb of two lines at most, the crowd strip. NO skill
  line on the card (desktop or phone). `lib/game-blurbs.js` entries are 30 to 56 characters and say
  what the puzzle IS; they never repeat the question count or the one-life rule, which the chips
  carry (`scripts/verify-game-blurbs.mjs` enforces the range). The card is a CSS container: when it
  is too narrow for both chips on one line, EVERY card stacks them, so the difficulty chip is never
  silently dropped and rows stay level.
- **Run tiles** (`app/today/RunGateTile.jsx`): eyebrow "Daily Run", name, ONE headline line, legs,
  button, crowd strip. No leg count in the eyebrow and no second rule line. The count in the strip
  is the person icon and a number, never the word "playing". More Runs and Build a Run use the same
  skeleton (More Runs lists its three most played as a legs strip).
- **Cap controls**: View, then Sort, then Group (or Show / Kind on a category pane), then search
  with the spare width. Each group carries a small label from `data-lab`, drawn only in the cap.
- **Rail**: every box opens with its name at the left in plain type and the reader's standing (or
  "See all") at the right: Your Challenges, the group's name, Everyone. The scope tabs sit under
  the Everyone header.
- **Index (5A)**: the category rows, All Puzzles and My Puzzles are ONE outlined box with ink
  dividers, like Everything Else (`.ixj1` / `.ixj2` from `ixBtn` round the first and last rows).
  The open block shows its count as a fill like the rows, not a separate bar (the Full color look
  keeps the bar). Categories / Skills and Reorder share one line as text toggles.

## The phone's coherence pass (owner, 2026-11-11)

Owner on the phone mockups: "i like m1b and m2", then "i like all of these". Built in
`app/today/StageToday.jsx` (the `.sty-mph` block and the last CSS block).

- **Home tiles (M1B, and Skills too):** every tile, All Puzzles and My Puzzles read "4 of 39" with a
  small bar of today's plays (`em.pg`). No more "39 games" / "15 starred". Tiles keep full colour.
- **Ranks:** plain figures with no box; the middle one is labelled with the group's own name; the
  third reads "All-Time". **Everything Else:** ink dividers, no arrows, Runs carries "x of y".
- **Pane controls (M2):** Sort and View share ONE row (`.mph-ctl`), each a joined switch (`.mph-sg`)
  under a small label. The header count is "3 of 33" (no "played"). The card's crowd strip is the
  person icon and a number, never "playing".
- **Played sinks (N2):** in every pane the played cards sit at the foot under "Played · n"; the
  Puzzles label counts what is left ("Puzzles · 30 left").
- **All Puzzles is grouped by category on a phone (N3):** open puzzles run category by category
  under counted labels (`.mph-jl`), the pane's sort applies INSIDE each group, and a "Jump To" row
  of category chips scrolls to each label.
- **THE PINNED PANE HEADER AND THE iPHONE BARS (N1).** `.mph-pane .sty-mtop` is `position:sticky`.
  iOS Safari tints its top bar from the fixed or sticky element under the top edge, so this bar is
  OPAQUE and ALWAYS the page's own ground: `background:var(--sot-root-paint, var(--stg-ground))`.
  A pinned bar with its own colour, a translucent ground, or one that kept a stale colour while the
  page recoloured is what broke the bands before. Nothing is pinned at the foot. If a pinned bar is
  ever added elsewhere, give it the same background rule and test on an iPhone in a tinted pane,
  an untinted pane, and through a flood into a game and back.
- **The start screen carries the card (N5, built 2026-11-11):** `app/GateCard.jsx`, lazy-loaded from
  `app/GateScreen.jsx`, portals the card's board tile, two chips and blurb into every daily's
  `.stg-gate`, between the name and the game's own short rules. Its host div sits BEFORE the gate's
  last child and is never first or last, because GateScreen styles `:first-child` (the hidden title)
  and `:last-child` (the action row). No crowd strip there: it would cost a board read per load.

## Lamps, Paths, Roll, Topple, Jig and Saw on the white stage; the board size ceiling (owner, 2026-11-12)

- **All six play on PlayStage at every width**, from Start until the ending's board view
  (`stageOn = STAGE && phoneStage && g.t0 && (playing || !revealed)`, the Parker rule). The page board
  is not rendered while the stage is up, because each board carries refs and handlers that must
  mount once (Roll/Topple canvases, the Paths map's svgRef, Lamps' gridBoxRef, Jig/Saw's play refs).
- **Paths, Roll, Topple: the game play board is unchanged** (owner ruling). Roll and Topple take a
  `stage` prop on RollBoard / ToppleBoard that draws the same canvas with stage furniture (ink-outlined
  pad and buttons; the pad hides on a desktop with a mouse). Paths draws its key, map and marking
  from shared consts (`ptKey`, `ptSvg`, `ptReview`) on either surface. The perfect cost never shows in play.
- **Lamps keeps the live board's details** ("make lamps a bit more similar to current styling
  details"): the Still dark meter, beams, pips under each number (underlined when met, struck when
  over), hatched blocked walls, the ruled-out dot and the key. `LM_ST_VARS` repoints the board's own
  variables at the stage tokens: lit squares the pale rose, lamps the full rose, walls ink slabs,
  unlit squares white with a grey edge, the picked square an ink ring.
- **Jig and Saw keep their table, tray and phone play box unchanged.** On a desktop the stage uses the
  page's full screen fit (`fitOn = full || (stageOn && !narrow)`) and `JG_ST_CSS`; the page's Reveal
  line and Full screen button step aside for the stage foot. The phone box scrolls the `.pst`, not the
  window (`scrollHost()`), and the stage's rise animation is off there: a filling transform animation
  makes `.pst-top` the containing block of the fixed tray dock.
- **`big` on PlayStage** lets the column follow the screen past `wide`'s 1000px (to 1600px); the
  board inside is still capped by the height it has.
- **THE CEILING (owner, 2026-11-12: "Four got too big ... huge on desktop wide screen").**
  `usePlayStageFit(ref, sel, on, beside, min, max)` takes a `max`: fitting to height alone grows a
  small grid without end on a tall monitor (Four's discs reached ~145px at 2560x1440). End Game
  boards stop near 80px a square (Four 540, Turn / Yose / the SlateStage chess boards 680, Gift
  640); the six boards above stop near 100px a square (Roll and Topple `H * 100 / TW`, Lamps
  `N * 100`, Paths from its CELL). The width-capped boards (Carve, Sums, Hedge, Duet) already stop
  at 460 to 640px. A new board that fits to the height passes a `max` too.

## The ending's way home and the jigsaw shelf link (owner, 2026-11-12)

- **Every ending's first screen (`app/EndFirst.jsx`) carries the Mind Loft pill top left**, on desktop and
  phone: back arrow, the mark in ink, "Mind Loft". It goes where All puzzles goes (`homeHref`), and the
  owner is fine with the two doing the same thing.
- **Jig and Saw only:** the top-right row starts with "Jigsaw puzzle shelf" (`shelfHref`, passed by
  StageStick for gameKey jig / saw: `/jig/shelf`, `/jig/shelf?g=saw`).
- **Jig and Saw on a phone (snap mode): a wrong drop stays on the board** where it landed (`g.st`, centre
  in board units), on top, and can be picked up again; it still snaps in near its own spot. Let go off the
  board, it goes back to the tray. On the stage the column ends with room for the fixed tray dock
  (`--jg-dockh`), so the foot's Give up is never under it.
- **Order of the three plays (owner, 2026-11-12): Play Similar, Switch Gears, then the run** (Your Run /
  Start a Run). The Full Results Page's Up next row shows these SAME three picks, in that order, each
  under its label (`EndNext` `picks`, from StageStick's `firstPicksList`); the old path stops are only
  the fallback when the first screen had no picks.

## One header width on every puzzle (owner, 2026-11-12)

- On a desktop (>= 900px) the stage top bar (`app/StageTopBar.jsx`, `.stb`) is ONE width everywhere:
  `min(1040px, 100vw - 48px)`, centred on its column, reaching past a narrow phone-width column and
  stopping short of a big board's. This supersedes "the header matches the play area's width"
  (2026-10-31): the owner found narrow ones too bunched and the 1600px ones too spread.
- Paths shows its perfect cost in the stage foot during play ("Cost N · perfect P · ..."), owner
  2026-11-12, replacing the old rule that the low score stays hidden until the round ends.

## Soft pastel on the boards, the foot off a phone's screen (owner, 2026-11-12)

- **The stage accent is the home tiles' soft pastel in the light looks.** `accentVars` (app/PlayStage.jsx)
  sets `--pst-acc` to `sitePastelHex(hex)` (the category colour 60/40 with white) when the look is not
  dark; the dark looks keep the full colour. One switch, every PlayStage board. The pale step, the deep
  text colour and the ink on the fill are unchanged.
- **On a phone the foot (Clock, How to play, Give up) sits just below the screen.** StageFoot's CSS makes
  `.pst-col`, `.wst-col` and `.bks-col` one foot row plus a gap taller than the screen, and
  `lib/play-stage-fit.js` leaves `.sft` out of the height a board must share under 900px. A short
  scroll reaches the foot; the play gets the screen.
- **Jigsaw buttons on the stage:** `.pst button{font:inherit}` outranks single-class sizes, so Jig / Saw
  restate `.jg-swb` (13px, 12px in the phone box, matching the Edges / Colors / All toggle) and `.jg-ob`.

## Stage wave five (2026-11-12): Emcee, Encore, Flank, Focus

- Emcee and Encore share one board const (`xwBoard`) rendered either on the page or in PlayStage `wide`; never both. Emcee's `--mc-blk` black-square rules also target `.xw-st` so blocks stay black on the stage. The page Reveal button is hidden on the stage; give up is the stage's two-tap.
- Flank renders `renderLeg(onStage)`; the stage hides the kick line, figures and page give-up. `.pst button{font:inherit}` overrides the Add button, so it is restated as `.pst .fl-st .lg-go`.
- Focus renders `fcBoard`; the view is sized by `calc(100dvh - 400px)` on the stage and its page buttons are hidden.
- Potluck, Mixtape and Mishmash are NOT on PlayStage: their play runs inside `/quiz/<id>` (QuizClient), which the quiz session owns. Only their gate and end card live on the daily page. Do not restyle QuizClient from a daily-games session.

## The category reorg: Visual and Table Games (owner, 2026-11-12)

Owner asked how Spot made sense in Logic, wanted a comprehensive reorg, and ruled the TOTAL stays at
ten because the colour schemes are good. He picked "option A" from a mockup and named both new ones.

- **Visual** (16) is new: the photo puzzles (Jig, Saw, Swap, Slide, Spin), the observation puzzles
  (Spot, Witness, and Focus, which came out of Trivia) and the moving pieces (Parker, Impound,
  Junkyard, Topple, Roll, Chomp, Paths, Tangled). It took the magenta ramp step Cards had held.
- **Table Games** (19) is Cards and End Game merged. It kept End Game's gold step.
- **Logic** (21) is deduction only. Defuse and Sworn stayed.
- Crowd Psychology was offered a merge with Price Check ("Hunch") and the owner kept it as it is.
- **The ramp is positional**, so only two names changed in `RAMP_ORDER` (`lib/category-ramp.js`):
  `End Game` became `Table Games` and `Cards` became `Visual`. Every keyed map followed the same
  swap, which is why no colour moved off its step (the quiz topics in `QZ_CAT` included).
- **End Game is now a ROSTER, not a category.** `isEndGame(key)` reads `END_GAME_KEYS` in
  `lib/daily-games.js`. Anything that used to test `cat === 'End Game'` calls it instead. A new
  endgame daily must be added to that set (see scoring.md).
- **Saved category orders are migrated on read.** `migrateCatOrder` in `lib/category-ramp.js` maps
  the two old names in `sot_cat_order`; every reader of that key passes through it.
- **Kind rows** (`lib/category-kinds.js`): Visual has Photo Puzzles / Observation / Moving Pieces,
  Table Games has Cards / Chess / Board Endgames, and Logic dropped Moving Pieces (three kinds now).
- **Pages** (`lib/puzzle-categories.js`): `/visual-puzzles` and `/table-games` are new whole-category
  pages. `/card-games` and `/end-game-puzzles` are now SUBSETS of `/table-games` and name their games
  in `keys` by hand (nothing is appended to a subset), so a new card or endgame daily is added to
  both its subset page and the parent. A card game's cap still links `/card-games`, an endgame's
  `/end-game-puzzles`, a chess title's `/chess-puzzles`.
- **Set pages**: the Photo puzzles, Traffic jams and Roll and route sets moved to
  `/visual-puzzles/<set>` with permanent redirects from `/logic-puzzles/<set>` in `next.config.js`.
  Close reading became Observation puzzles (`/visual-puzzles/observation-puzzles`, redirected). The
  two endgame sets carry `under: 'end-game-puzzles'` in `lib/puzzle-sets.js` so their addresses stayed.
- **Legacy lowercase ids** (`CAT_META` in `app/DailyEndCard.jsx`, `CATEGORIES` in
  `app/DailyGamesGrid.jsx`, `CAT_BLUE` in `lib/home-blues.js`): the `endgame` id now prints Table
  Games and holds the card games too; `visual` is a new id.
- **Not redone:** the static share cards in `public/og/` were baked in the old category colours
  (card games in magenta, the Visual games in rose). They are still correct cards; re-bake them when
  a network environment is available.
