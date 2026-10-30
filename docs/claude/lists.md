# Lists (lib/data.js)

> Split out of CLAUDE.md on 2026-10-29 to keep the auto-loaded file small. Rules here are verbatim and still binding.
> Scope: Lists (lib/data.js): Borda consensus, sources, rating platforms, data fields, links, descriptions, hero images, activity ledger, renames, indexing

## ⚠️ NATIVE VOTING REMOVED (2026-06-18) — overrides everything below

On-site user voting was removed sitewide. The crowd signal now comes only through the
aggregator sources (Yelp / Google / TripAdvisor) already blended into the consensus. This
note overrides any older vote-related instruction anywhere in this file:

- **No `vote` blocks in `lib/data.js`.** Lists carry `sources` (and the `ai` seed) only.
  Do NOT add, seed, or maintain a `vote:` / `vote.items` block on any list. The historical
  `### vote.items` section below is DEPRECATED.
- **Seed `ai` only.** When you recompute a Borda consensus, re-seed `ai.items`. Ignore every
  older instruction that also says "re-seed `vote.items`" — there is no `vote.items` anymore.
- **No Vote tab and no `votes` mode behavior.** The list page has no Vote tab; `getSources`
  no longer scores or appends any user-vote column; the activity feed shows no vote events.
- **Media crowd reweight still applies, but WITHOUT the fan-vote clause.** The "Media lists:
  crowd-vote tilt" rule still reweights critic vs. aggregator sources; just drop the old
  0.75x live-fan-vote weighting — there are no fan votes to weight.
- **List pages show the FULL ranking.** `ListOverview` renders every consensus item, not just
  the top 10 (only the top 10 carry descriptions). Home tiles, the cron snapshot, and OG
  poster images stay capped at 10.

---

## ⚠️ Source-change pre-flight checklist (run EVERY time you add/change/remove a source)

This consolidates the source rules below into one runnable list. Skipping any step has caused real
production gaps (Amazon source added across 80+ lists with no audit notes, no ranking-change ledger
entries, and only verified after the owner caught it). Do ALL of these, in order, every time:

0. **Re-read the relevant sections of THIS file first** (do not work from memory): "Source-rule changes
   ALWAYS carry a note", "Activity Ledger labels", "Post-deploy consensus-check trigger", and the
   media crowd-vote rule if the list is media.
1. **Make the change** on a FRESH origin/main clone: add/remove the source, order its items by true
   rank, set weight/unordered/trueExpert. On MEDIA lists set an explicit weight on EVERY source
   (critics 0.5x, crowd incl. Amazon/Goodreads 1.5x) and add the weight suffix to each label.
2. **Re-seed** ai.items + vote.items to the recomputed Borda consensus (helpers.js, absent = 0).
3. **Descriptions + heroes:** descriptions.js for any item newly in the top 10; hero-images.js for any
   item newly in the top 3 (restaurants: FOOD/DINING photo only; ALL heroes must be on an
   optimizer-friendly host — Resy/Eater/Wikimedia/publication CDNs work; Washingtonian, Squarespace,
   getbento, Amazon, and most brand sites are blocked by the Next image optimizer and render 0x0).
4. **sourceRevisions[sourceId] note**, reader-facing, NO em dashes, applied to EVERY affected list in
   the same pass. A brand-new source uses ADDITION framing ("New source (Month YYYY): ..."), not
   "Correction" (Correction is for re-encodings/reweights/removals).
5. **Stamp rating-data.js** for every rating gathered (RATING_DATA[listId][item][platform] =
   {rating,count,date}).
6. **Validate + deploy:** node --check, verify ZERO unexpected deletions, push.
7. **Trigger the cron** (GET /api/cron/consensus-check via the browser; web_fetch returns empty). The
   ranking-change ledger entries for a source ADDITION are only captured if a PRE-change consensus
   snapshot exists to diff against; a brand-new list (or one whose snapshot already reflects the new
   source) will record nothing, so seed the pre-change snapshot first if needed.
8. **VERIFY ON THE LIVE SITE — do not stop at "push succeeded".** Open the list page Activity Log AND
   the master /feed and confirm the "Source added / Sources Revisited" card renders WITH its ranking
   movements and note. After a bulk change, confirm the master /feed (capped at 800 alert rows) shows
   the full set, not a truncated subset.


## ⚠️ New-list pre-flight checklist (run EVERY time you publish a brand-new list)

Separate from the source-change checklist above. A brand-new list (or a batch of them) is NOT a source
change, so those steps do not all apply — but these do, every time:

1. **Build on a FRESH origin/main clone**, compute the Borda consensus, and seed `ai.items` + `vote.items`
   to the displayed top 10.
2. **Descriptions for EVERY pool item** (descriptions.js) and **hero images for the top 3** (hero-images.js),
   on optimizer-friendly hosts — verify each hero through the LIVE optimizer after deploy
   (`fetch('/_next/image?url=<enc>&w=1200&q=75')` in the browser; must return `image/*`, not an error).
3. **Stamp `publishedAt` (and `publishedDate`) at PUSH TIME, and make them the NEWEST in the file.** Capture
   `date -u` immediately before the commit, give each list in a batch a DISTINCT timestamp in newest-last
   order, and run the VERIFY check in the `publishedAt` field reference below (`grep ... | sort -r | head`)
   to confirm your new lists sit at the very top. Hardcoding a build-time timestamp is the #1 recurring
   miss: it buries the new list beneath lists pushed earlier the same day. THIS HAS HAPPENED REPEATEDLY.
4. **Validate + deploy:** `node --check` all edited lib files, confirm ZERO unexpected deletions
   (`git diff | grep -cE '^-[^-]'` returns 0), push.
5. **Trigger the cron** (GET /api/cron/consensus-check via the browser) so the new list gets its launch
   consensus snapshot. For a brand-new list `newAlerts:0` is expected (all sources fold into "N sources at
   launch"); there is no "Source added" card.
6. **VERIFY ON THE LIVE SITE:** the list page renders the full consensus, descriptions, and top-3 hero
   photos, AND the new list appears at the TOP of the homepage "Most Recent" order.


## HARD PUBLISH GATE — never ship a list missing its full required source set (owner rule, 2026-06-06)

**A list may NOT be published/deployed until it carries the COMPLETE set of initially-required
sources for its type. Deferring any required source to a later "backfill" is NOT allowed unless the
owner explicitly approves that deferral in chat, in the same session, before the push.** This is a
hard gate, not a guideline. The owner discovered several food lists (e.g. `pizza-new-haven`) that
shipped in a batch with the Yelp/Google rating sources silently deferred; that must never happen
again. Building the editorial sources first and "owing" the rating axis is a violation of this gate.

**Required initial source set by list type (all must be present at publish time):**

- **Food & drink (restaurants, bars, cafes, bakeries, breweries, etc.):** at least THREE
  editorial/expert publications **plus** the two rating-platform sources for the geography (US/Canada
  = **Yelp + Google**, Yelp listed first; elsewhere = the regional priority platform + Google per the
  regional platform map). **Pizza lists additionally require the One Bite / Dave Portnoy `portnoy`
  true-expert source.** A food list with only editorial sources, or only rating sources, is incomplete.
- **Hotels / resorts:** at least three editorial publications **plus** the live `pricing` source
  (and Google/TripAdvisor review signal where used).
- **Physical product lists (`amazon`):** editorial "best of" review sources **plus** the Amazon
  ratings source (and the `pricing` positioning source for flagship-tech lists).
- **Book lists:** editorial sources **plus** the Goodreads ratings source.

**Also required before publish (the rest of the build checklist), not just sources:** for location
lists, `links` + `itemLinks` + `itemYelp`/`itemTripadvisor`; for every list, **descriptions for all
10 consensus top-10 items and hero images for the top 3** (recompute the Borda consensus AFTER all
sources are in — rating sources reshuffle the top 10, so new entrants need descriptions/heroes too).

**If a required source genuinely cannot be gathered** (e.g. the platform is bot-walled like Dianping,
or no third editorial exists for a niche topic): do NOT silently ship without it. STOP, tell the
owner exactly what is missing and why, and get explicit approval to ship the reduced set. Record the
approved exception in the list's session notes.

---

## How Consensus Works

The Consensus tab on each list is computed live using **Borda scoring**:

- Each publication source ranks its items. Rank 1 = 10 pts, rank 2 = 9 pts ... rank 10 = 1 pt.
- Items not ranked by a source receive ZERO from that source (no average credit). The og-images script once drifted on this point and awarded the source average to absent items, which silently produced a wrong predicted top 10 for a new list; always verify a new list's consensus with the lib/helpers.js getSources logic (absent = 0), not a stale copy.
- The `seed` source (keyed `ai` internally) is **excluded from Borda** — it is a display placeholder only, never used in scoring.
- Live fan votes from Supabase are weighted at **0.75x** of one publication.
- Tie-break: by appearance count across sources, then alphabetically.
- Consensus is always exactly the **top 10** items by Borda score.
- Expert source lists can have **any number of items** — not limited to 10.
- A source flagged `"trueExpert": true` is weighted more heavily than a normal expert — see **True Expert Sources** below.

**Key implication:** If an important item is missing from the consensus, the fix is always to improve the expert source data — ensure the item appears in multiple sources at appropriate rank positions. Fan votes alone (at 0.75x) cannot overcome a weak showing across publications.

### Tier backfill: fill to 10 with next-best only when qualifying items run out

Some markets simply do not contain ten items that meet a list's tier criteria (luxury hotels in
Helsinki or Kyiv, fine dining in a small city, etc.). The default behavior is correct, the list shows
only the genuine qualifiers and the header reads e.g. `HELSINKI · TOP 8`. But when the owner wants a
full top 10, the remaining spots may be filled with the **next-best items that do NOT meet the tier
criteria** — and ONLY then. This is a last resort, never a shortcut:

- **Trigger condition (strict):** use backfill ONLY when the genuine tier-qualifying items number fewer
  than 10 AND a thorough search confirms no additional qualifying items exist. If ten on-tier items
  exist, you MUST use them, never a more convenient sub-tier pick.
- **Backfill items occupy trailing spots ONLY.** They can never outrank a genuine qualifier. If a list
  has 8 qualifiers, the 2 backfill items can occupy only spots 9 and 10, in that order. This is
  enforced by the engine, not by hand (see below).
- **They blend in silently** — no label or visual marker distinguishes a backfill item from a real one
  on the page.
- **Data placement: `ai` seed + `vote.items` ONLY, never a source.** Add each backfill item to the end
  of the `ai` seed (after all the qualifiers, in best-to-worst backfill order) and to `vote.items` so
  both reach 10. Do NOT add backfill items to any editorial/rating source: they must earn ZERO Borda so
  they never distort the real consensus ordering.
- **How it surfaces (engine support):** `getSources` in `lib/helpers.js` (and its three mirrors,
  `scripts/generate-og-images.js`, `app/list/[id]/opengraph-image.js`, `app/list/[id]/twitter-image.js`)
  pads the Borda consensus up to 10 from the `ai` seed when fewer than 10 items score. Seed items not
  already in the consensus are appended in seed order, AFTER every scored item. Because backfill items
  live only in the seed (never a source), they are unscored and can only land in the trailing spots,
  exactly as required. A list with fewer than 10 seed items stays short (no padding from nothing), and a
  list that already has 10+ scored items is unaffected.
- **Still do the full build treatment.** A backfill item is still a real place/product: give it correct
  parentheticals, `links`/`itemLinks`/`itemYelp`/`itemTripadvisor` as applicable, confirm it is open,
  and write its consensus description (and a hero image if it lands in the top 3, which it normally will
  not since it sits at the bottom).
- **All four mirrors must stay in sync** with any change to this padding logic, like every other scoring
  rule.

### Planned engine change: source recency multiplier

Not yet implemented, but planned. Each source will carry a `publishedYear` field. The scoring engine will apply a multiplier based on how recently the source was published: current year = 1.5x, prior year = 1.0x, two years prior = 0.75x, three years prior = 0.5x (three years remains the max age). The `ai` seed and `pricing` source are exempt. Requires updating `getSources` in `lib/helpers.js` and its three mirrors (`scripts/generate-og-images.js`, `app/list/[id]/opengraph-image.js`, `app/list/[id]/twitter-image.js`). Until this ships, the data-level rules (One Bite true expert, current-year source requirement, review-count floor) are the primary mechanism for surfacing excellent new openings.

### True Expert Sources

Some sources are exceptionally authoritative for a topic, and should pull more weight than an ordinary publication. Flag these with `"trueExpert": true` on the source object.

A true expert's Borda contribution is scaled by a weight equal to **half the combined weight of all the other (non-true-expert) experts, with a floor of 2x one normal expert**: `weight = max(2, N_other / 2)`, where `N_other` is the summed weight of the other experts (each normal expert is weight 1). Worked examples:

| Other experts (`N_other`) | True expert counts for |
|---|---|
| 1 | 2 (floor) |
| 2 | 2 (floor) |
| 3 | 2 (floor) |
| 4 | 2 (floor) |
| 5 | 2.5 |
| 6 | 3 |
| 8 | 4 |

The floor guarantees a true expert always counts for at least two ordinary experts; beyond that it scales to half the rest of the expert field. Everything else (rank ordering, the `unordered` size-scaled flat rule, the top-10 cutoff, tie-breaks) works exactly as for a normal source — only the per-source multiplier changes. A source may also set an explicit numeric `"weight"` to override the default 1 for fine control.

Implemented in `lib/helpers.js` `getSources` and mirrored in `scripts/generate-og-images.js` (`computeConsensus`) — keep the two in sync.

**Known true experts:**

- **Johnny Novo** (`johnnynovo.com/rankings/...`) — a rigorous, single-author burger ranking with per-establishment ratings. Used as a true expert on `burgers-nyc`. Order his source by the published rating, descending (it is a ranked source, not `unordered`).
- **Dave Portnoy / One Bite** (`onebite.app`) — numeric pizza scores (publicly readable, not image-gated like the Infatuation). Used as a true expert on **all pizza lists**. Gather scores live via Chrome, order descending by score. Source id: `portnoy`. This is the primary mechanism for surfacing excellent new pizza spots that predate most editorial lists. **Every Portnoy review is also a YouTube video, so pizza lists carry a per-item `Portnoy Review` play button** (see True-expert video content below).
- **Source of Truths (SoT)** — the in-house ranking produced by the SoT True Expert input process below. Source id: `sot`. Used only on lists where the owner explicitly requests it.

### Decisive Expert Sources (`decisiveExpert: true`) — Michelin stars on best-restaurant lists (owner rule, 2026-06-09)

Some signals are so authoritative for a topic that they should outweigh even a true expert and dominate the consensus. Flag these with `"decisiveExpert": true`.

A decisive expert's Borda weight is **`max(6, 1.5 × field)`**, where `field` is the combined weight of all the ordinary sources (everything that is NOT a decisive or true expert). So it is worth **1.5× the entire rest of the field, with a floor of 6** — the single strongest source, worth more than every other source combined. The whole field acting in unison can still balance it, but no single source comes close. Where a **True Expert** is worth HALF the field (`max(2, field/2)`), a **Decisive Expert** is worth 1.5× the field. Both special tiers are excluded from the `field` sum, so they never inflate each other. An explicit numeric `weight` still takes precedence over both, as for a true expert.

| field (sum of ordinary weights) | True Expert counts for | Decisive Expert counts for |
|---|---|---|
| 2 | 2 (floor) | 6 (floor) |
| 4 | 2 (floor) | 6 (floor) |
| 5 | 2.5 | 7.5 |
| 6 | 3 | 9 |
| 8 | 4 | 12 |

Implemented in `lib/helpers.js` `getSources` (`sourceWeight`) and mirrored in `scripts/generate-og-images.js`; bump `SCORING_ENGINE_VERSION` when the math changes (done 2026-06-09). (The `opengraph-image.js` / `twitter-image.js` social-preview routes do not implement source weighting at all — a pre-existing gap — so they render an unweighted preview; sync them only if that ever matters.)

**Scope — Michelin STAR ratings on best-restaurant / food lists ONLY:**

- The canonical decisive expert is the **Michelin Guide star rating** on a "Best [restaurants/cuisine]" list. The Michelin source MUST be a single **tier-ranked** source ordered by star count (3★ first, then 2★, then 1★, then in-guide-but-unstarred "recommended/Selected" last), alphabetical within each tier — NEVER `unordered`, EXCEPT a source covering a SINGLE star tier (e.g. only the 3★ spots), which is a flat membership signal and stays `unordered` + `decisiveExpert`. Where a list previously split tiers into separate per-tier sources, consolidate them into one tier-ranked decisive source.
- **Drop spots removed from the guide.** Keep a spot only if it is still recommended (still in the current guide at any level); drop it entirely if it has been removed (e.g. Sushi Saito, delisted 2019). A dropped spot stays on the LIST via its other sources (Tabelog, 50 Best, etc.) — it just no longer carries the Michelin signal.
- **Not for:** Michelin Bib Gourmand / "Recommended"-only roundups (ordinary sources, not star ratings), Michelin **Key** hotel ratings (hotels are out of scope), or any non-restaurant list.
- One decisive expert per list, maximum. It does NOT count toward the three-editorial-source floor.

**Known decisive experts:** Michelin star sources on `best-sushi-in-tokyo`, `best-indian-restaurants-london`, `restaurants-monaco`, and all `no-budget-dinners-*` city lists (best-in-class restaurant lists where money is no object).

### True-expert video content — per-item play button (`itemVideo` / `itemVideoLabel`)

When a true-expert source ALSO publishes a video review per item (the One Bite / Dave Portnoy
reviews are each a standalone YouTube video; the same applies to any future video-publishing true
expert), surface that video on the list as a **play button on each item**, so a reader can watch the
expert's actual review. This is in addition to the source's ranked score data, not a replacement for
it. Required on every pizza list (each `portnoy` source item that has a video).

- **Data field: `itemVideo`** — an object on the list mapping the exact item-name string (parenthetical
  and all, byte-for-byte identical to the name used everywhere else) to the **official YouTube watch
  URL** of the review, e.g. `'Regina Pizzeria (North End)': 'https://www.youtube.com/watch?v=XXXXXXXXXXX'`.
  Cover the union of the relevant source's items plus `vote.items`. A missing per-item entry simply
  drops the button for that item.
- **Label: `itemVideoLabel`** — a string on the list that sets the button text. Defaults to `'Video'`
  in code; **set it to `'Portnoy Review'` on every pizza list** (and to the analogous expert name on any
  future video-publishing true expert). One label per list.
- **How it renders:** a filled play-button chip (ember background, ▶ icon) appears in the per-item
  expanded link panel on the list page AND in the overview-tile link row, opening the video in a new
  tab. Implemented via `itemVideo` in `buildAuxLinks`/`DataRow` in `app/list/[id]/DetailClient.jsx` and
  `buildLinks`/`LinkRow` in `app/list/[id]/ListOverview.jsx` (the two mirrors must stay logic-identical,
  like the pics config). It is not tied to location lists, so a future non-location true expert with
  video works too.
- **Gathering (live, never guess an ID):** search YouTube through the connected Chrome for the One Bite
  review of the venue (`one bite pizza review <venue> <city>`), confirm it is the **official upload**
  (the "One Bite Pizza Reviews" / Barstool Sports channel, Dave Portnoy), and store the canonical
  `https://www.youtube.com/watch?v=<id>` URL. Reject fan re-uploads, compilations that are not that
  venue's review, and reaction videos. **App-only reviews:** some One Bite reviews have no YouTube
  upload and live only on the One Bite app (the review page plays a Mux-hosted clip, not YouTube) — in
  that case store the `onebite.app/restaurant/.../review/...` page URL instead (the video plays there),
  which the owner can supply directly. Confirm the page is the correct venue/location before using it.
  If a scored item genuinely has neither a YouTube upload nor a One Bite review page, omit it from
  `itemVideo` (its button just doesn't show) — never fabricate or pattern-guess a URL or video ID.


### SoT True Expert input — the in-house research process

Source of Truths itself can act as a True Expert on a list: a ranked source built from Claude's
reasoned synthesis of all gathered evidence plus the owner's direct input. It carries the standard
`"trueExpert": true` weight (`max(2, N_other / 2)`), so it is reserved for lists where the owner
has real conviction about the ordering.

**When to use it: ON REQUEST ONLY.** Never add an SoT source to a list on your own initiative.
The owner asks for SoT input on a specific list; that request is the trigger. (If a list's
consensus looks wrong and no fix exists in the editorial data, *suggest* SoT input — but do not
build it without an explicit yes.)

**The process — Claude drafts, the owner approves:**

1. **Gather everything first.** Complete all normal source research for the list (editorial
   sources, rating platforms, pricing where applicable) BEFORE drafting the SoT ranking. The SoT
   source is a synthesis layer on top of the evidence, never a substitute for gathering it.
2. **Claude drafts the ranking.** Synthesize across every signal collected: editorial frequency
   and positions, rating-platform scores and review counts, recency of acclaim, tier fit, and any
   owner preferences already on record. Produce a ranked list (typically 10–15 items, any length
   allowed) with a **one-line justification per item** explaining its position. Reason about
   disagreements between sources rather than averaging them — the point of the SoT source is
   judgment, not arithmetic.
3. **Present the draft to the owner in chat** — ranked order plus the per-item justifications —
   and ask for edits. The owner may reorder, add, or drop items. Items the owner adds must still
   pass the list's tier rules (no chains, on-tier, currently open, correct geography) and get
   full data treatment (`links`, `itemLinks`, `itemYelp`/`itemTripadvisor`, parentheticals).
4. **Iterate until the owner approves.** Do NOT deploy an SoT source the owner has not explicitly
   signed off on in that session. The approved order is final — never silently "fix" it later;
   revisions go back through the owner.
5. **Add it as a ranked source.** Source id `sot`, flagged `"trueExpert": true`, never
   `"unordered"`. Label it with the process and date so readers know what it is:
   `'Source of Truths · House Ranking (June 2026)'`. Item names must match the list's canonical
   names byte-for-byte. No `url` is needed; per the publication-link rule it has no article page,
   so it renders as plain text (if `expertGroupKey` would hyperlink a trueExpert without a `url`,
   verify it degrades gracefully before shipping).
6. **Re-seed and verify.** After adding the SoT source, recompute the Borda consensus
   (helpers.js logic, absent = 0), re-seed `ai` and `vote.items` to the new blend, and refresh
   descriptions/hero images if the top 10 or top 3 changed.

**Guardrails:**

- The SoT ranking must stay **grounded in the gathered evidence**. Claude's draft may weigh and
  re-order based on reasoning, but every item must appear in at least one real source or be
  owner-added with live-verified data. Never rank from memory.
- One SoT source per list, maximum. It does not count toward the three-editorial-source floor —
  the list still needs its three real publications.
- Record the owner's reasoning for notable calls (e.g. "owner moved X to #1: ate there last
  month, best version in the city") as a comment above the source in `lib/data.js` or in the
  session notes, so future sessions don't second-guess the order.

---

### Peak-portfolio rating source (`peakbeers`) — rank producers by their ten best products

First used on `best-breweries-world` (June 2026). For producer lists (breweries, wineries, distilleries,
coffee roasters), add a ranked source scoring each producer by the **average rating of its ten best
products** on the category's deepest per-product rating platform (BeerAdvocate for beer: each brewery
profile lists every beer with its own rating and count).

- **Method:** among the producer's active products with >=25 ratings, average the 10 highest-rated.
  Where fewer than 10 qualify, relax the floor to >=10 ratings, then to all rated products (>=3 ratings),
  and note the relaxed basis in a comment. Gather live; long BeerAdvocate pages TRUNCATE in web_fetch
  (Hill Farmstead cut mid-alphabet once), so parse the full table via the connected Chrome browser.
- **Label** with a rating keyword so it groups under Reviews & Ratings Aggregations, e.g.
  `'Top 10 Beers Avg Rating · BeerAdvocate per-beer data (June 2026)'`.
- **Weight:** give it an explicit numeric `weight` to make the methodology the dominant signal while
  the normal rating/editorial sources and fan votes still contribute (weight 4 on the breweries list,
  owner-ruled). This is the "weighted hybrid" alternative to a `mode: 'scores'` composite list: it
  keeps the Vote tab and Borda consensus.
- Ties within the source break by rating count, then alphabetically (100+-rating producers tie alpha).

---

### Media lists: crowd-vote tilt — critics are too biased (owner rule, 2026-06-10)

On any **TV, film, books, music, games, podcasts, or comics** list (in short: any "media" list, whether the items are titles, artists, or franchises), **critic sources count for less and crowd sources count for more**. Critic opinion drifts toward conventional taste and known names; the user wants the consensus to reflect what audiences actually liked.

The rule is mechanical: set explicit numeric `weight` on every source.

- **Critic sources → `weight: 0.5`.** Editorial publication rankings (Rolling Stone, Vulture, The Ringer, Paste, Time, Variety, IndieWire, Esquire, GQ, The Infatuation, Slashfilm, Looper, Collider, Shortlist, Newsweek, listicle-style outlets in general), and the critic aggregators **Rotten Tomatoes Tomatometer** and **Metacritic critic score**. Decisive/True Experts on media lists also get halved.
- **Crowd sources → `weight: 1.5`.** User-rating platforms (**IMDb user rating**, **Rotten Tomatoes Popcornmeter / Audience Score**, **Goodreads**, **Metacritic User Score**, Letterboxd, Bandcamp, Discogs, Steam user reviews, Amazon ratings on media items like books or music), reader/viewer polls (any source label containing the word "Readers" — T+L Readers, CN Traveler Readers' Choice, Newsweek Readers' Choice, Boston.com Readers' Poll, etc.).
- **Live fan votes** are crowd-by-definition and stay at their current engine weight (0.75x of one publication-source unit). Do not double-boost.
- **The ordinary `weight: 1` default does not apply on media lists.** Every source carries an explicit weight per the rule above; do not ship a media list with any unweighted source.

Apply this whenever building a NEW media list AND whenever you touch an EXISTING media list for any reason. When retrofitting an existing list, add the weights, recompute the Borda consensus, re-seed `ai` items + `vote.items`, refresh descriptions for any item entering the new top 10, and refresh hero images for any item entering the new top 3. Add a `sourceRevisions` note (per the universal source-change rule) explaining the reweight; use the canonical wording below so the activity ledger reads consistently across media lists:

> `'Correction (June 2026): media-list crowd-vote rule applied — critic sources (editorial publications, RT Tomatometer, Metacritic critic) now carry 0.5x weight and crowd sources (IMDb, RT Popcornmeter, Goodreads, Metacritic User, readers polls) now carry 1.5x weight, per the project rule that audiences are a more reliable consensus signal than critics on media lists.'`

Make the reweight reader-visible in source labels too: append `· 0.5x Weight` or `· 1.5x Weight` before the date, e.g. `'Rolling Stone · 100 Best Comedy Specials · 0.5x Weight (May 2025)'`, `'IMDb · Ranked by User Rating · 1.5x Weight (June 2026)'`. This matches the precedent set by the generalist-dish-list 0.5x labeling.

First applied 2026-06-10 to `standup-specials-netflix`. Outstanding retrofit (apply the same treatment the next time each list is touched, or in a deliberate sweep): every other media list on the site — `best-hbo-shows`, `best-films-21st-century`, `best-novels`, `beatles-songs`, `grateful-dead-songs`, all film/TV/book/music lists; check the `entertainment` and `product` tag filter on the homepage for the full set.

**Out of scope:** travel, food, restaurants, hotels, products (non-media), services. Those follow the existing rating-platform rules unchanged. The rule keys off the LIST being about media, not whether a particular source happens to be a user-rating platform.

---

## Data Structure

Each list entry in `lib/data.js` follows this structure:

```javascript
{
  id: 'kebab-case-unique-id',            // URL slug: /list/kebab-case-unique-id
  publishedDate: 'YYYY-MM-DD',           // Required. Use today's date.
  title: 'Best [Thing] in [Place]',      // Must start with a ranking descriptor (see title rules)
  category: 'New York',                  // Short label shown on card and OG image
  type: 'travel',                        // Primary type for legacy code (see valid values)
  tags: ['travel', 'luxury'],            // All applicable tags — be generous (see tag rules)
  linkType: 'mapsCity',                  // Controls item links (see values below)
  blurb: 'One or two sentences...',      // Editorial description shown on list page
  defaultSource: 'ai',                   // Always 'ai'
  mode: 'facts',                         // OPTIONAL — omit for default behavior
  links: { 'Item Name': 'https://...' }, // OPTIONAL — direct affiliate URLs for product lists
  sources: {
    ai: {
      label: 'Consensus Seed',
      items: [ /* 10 items */ ],         // Seed/placeholder — NOT used in Borda scoring
    },
    sourceid: {
      label: 'Source Display Name 2025',
      items: [ /* any number of items */ ],
    },
    // additional sources...
  },
  vote: {
    items: [ /* exactly 10 items */ ],   // Seeds the voting UI — same tier as sources
  },
},
```

---

## Field Reference

### `id`
Kebab-case, globally unique. Becomes the URL: `/list/[id]`. Examples: `pizza-nyc`, `thailand-beachfront-hotels`, `headphones-overear`.

### `publishedDate`
Always `'YYYY-MM-DD'`. Use today's date for new lists.

### `publishedAt`
**Required for new lists.** Full ISO 8601 UTC timestamp, e.g. `'2026-05-28T16:05:09Z'`. The homepage "Most Recent" sort prefers `publishedAt` over `publishedDate`. If `publishedAt` is omitted, the list falls back to noon UTC on `publishedDate`, which ties with every other list published that day and the tiebreaker is original array order — which puts new entries at the BOTTOM of the day, not the top.

**`publishedAt` must be the moment of publication, i.e. captured immediately before the push — never the build/research time.** Generate the timestamp with `date -u` in the SAME step that builds the commit and pushes, AFTER all gathering, editing, and `node --check` are done. Do NOT capture it at the start of a build or reuse one captured earlier; build time can be minutes or hours before the push, which makes the "Most Recent" order wrong. When publishing several lists in one push, give each a DISTINCT timestamp (e.g. one second apart) in the order you want them to appear, newest last-published first — never reuse the same timestamp for multiple lists (that causes ties that fall back to array order). Re-capture `date -u` for every separate push.

To get the current UTC timestamp in bash (run it as part of the deploy step, not earlier): `date -u +"%Y-%m-%dT%H:%M:%SZ"`.

**VERIFY the new list is actually the newest before you push (this check is mandatory — it keeps getting skipped).** "Today's date" does NOT make a list the newest: another list may have been pushed earlier the same day with a later wall-clock `publishedAt`. After stamping, run `grep -oE '"publishedAt": "[0-9T:Z-]+"' lib/data.js | sort -r | head` and confirm YOUR new timestamps sit at the very TOP of that sorted list. If any existing list has a `publishedAt` later than yours, raise yours above it (use the real current `date -u`, which is always later than anything already in the file). A new list that renders on the site but appears BELOW older lists in "Most Recent" means this step was skipped — the fix is to restamp `publishedAt` (and `publishedDate`) to now and redeploy. Do this in the SAME push, not as a follow-up.

### `title`
Must start with a **descriptor that implies a ranked list** (Best, Most, Worst, Top-Grossing, Largest, Highest-Grossing, etc. — owner rule 2026-06-07; previously limited to Best/Most/Top-Grossing). Title case. Examples:
- `Best Pizza in NYC`
- `Most Exclusive Golf Clubs in the World`
- `Top-Grossing Films of 1990`

### `category`
Short label shown on the card and in the OG preview image. Use the city, region, or topic. Examples: `New York`, `Travel`, `Tech`, `Thailand`.

### `type`
Primary category for legacy code paths. Use one of: `travel`, `food`, `entertainment`, `product`, `other`, `stores`.

### `tags`
Controls the filter chips on the homepage. **Be generous — apply every tag that reasonably fits.** A bar or speakeasy, for example, should carry all of: `bars`, `nightlife`, `stores`, `food-drink`, `entertainment`. A luxury hotel should carry `travel` and `luxury`. Valid values:

| Tag | Use for |
|-----|---------|
| `travel` | Hotels, resorts, destinations |
| `food` | Restaurants, food items, food spots |
| `food-drink` | Any food or drink establishment |
| `bars` | Bars, cocktail bars, speakeasies, pubs |
| `nightlife` | Clubs, late-night venues, dive bars |
| `stores` | Any physical place people visit |
| `entertainment` | Movies, TV, games, books, music, events |
| `tech` | Tech products |
| `product` | Physical products (non-tech) |
| `luxury` | Any luxury travel, hotel, or lifestyle list |
| `other` | Anything that doesn't fit above |

When in doubt, include the tag. It is better to over-tag than under-tag.

### `linkType`
Controls what each item name links to when clicked:

| Value | Links to | Use for |
|-------|----------|---------|
| `mapsCity` | Google Maps search by name | All restaurants, bars, hotels (US and international), any place findable by name |
| `amazon` | Amazon search with affiliate tag `cgurus-20` | Physical products |
| `imdb` | IMDB search | Films, TV shows |
| `steam` | Steam search | Video games |
| `wiki` | Wikipedia search | Historical items, factual lists |
| `google` | Google search | Anything not covered above |

**All hotels — US and international — use `mapsCity`.** Google Maps finds international hotels by name accurately. Do not use `booking` for any list.

### Song lists link to YouTube with a "Listen" button (owner rule, 2026-06-07)

Every song list (college fight songs, karaoke, artist song rankings, covers lists) must link each
item to a YouTube video via an explicit `links` object, and set `linkLabel: "Listen"` on the list so
the overview button reads Listen instead of View. Rules:

- **Preferred target: the song's official music video.** If none exists, the next closest official
  thing: official artist/label channel studio audio (or Topic upload). Avoid live recordings unless
  the canonical release is itself live (many Grateful Dead tracks) or no official studio upload exists.
- **Covers lists link the covering artist's version** (studio cut first, then official live release on
  the artist's channel); fall back to the original artist's official video only when the covering
  artist has no official upload at all (owner ruling 2026-06-07, grateful-dead-covers).
- **Gather video IDs live via YouTube search through the connected Chrome (never guess an ID)**, and
  confirm the upload is official: verified-artist badge, Vevo/label channel, or auto-generated Topic.
  Reject fan re-uploads, lyric channels, and reaction/karaoke versions. Rare exception: when an artist
  keeps their catalog off YouTube entirely (e.g. Garth Brooks), the highest-quality available upload
  may be used; flag it to the owner.
- `linkType` stays `wiki` as the fallback; the explicit `links` URLs override it per item. Cover the
  union of every source's items plus `vote.items`, exactly like a `mapsCity` links object.

First applied 2026-06-07 to college-fight-songs (relabel), most-requested-karaoke-songs,
grateful-dead-songs, grateful-dead-covers, and beatles-songs.

**IMPORTANT — `mapsCity` links and parentheticals.** Item names carry a parenthetical for context (e.g. `Amanoi (Vinh Hy Bay, Vietnam)`). If that raw string is dropped into a Maps URL, Google reads the parentheses and commas as a separator between two waypoints and opens a **driving-directions** screen (origin `Amanoi` → destination `Vinh Hy Bay`) instead of a location pin. Two safeguards prevent this:

1. The link builder must sanitize the name before building the URL — strip `(` `)` `,` `;` `&` (replace with spaces) and use the location endpoint `https://www.google.com/maps/search/?api=1&query=<encoded text>`. This endpoint always resolves to a single place. See `maps-link-fix.js`.
2. For any `mapsCity` list, also provide an explicit `links` object mapping each item name to its sanitized search URL. An explicit link always wins over the auto-generated one, so this guarantees correct behavior even if the helper is not yet patched.

### `mode`
Optional. Omit for default behavior.

| Value | Effect |
|-------|--------|
| omitted | Default — Consensus tab, Sources tab, and Vote tab all shown |
| `'facts'` | Factual/objective list — no voting, Sources tab only |
| `'scores'` | Composite-ranking list — `ai` ranking + read-only source chips, no voting (chain-city lists) |
| `'unranked'` | Unranked products — a curated, subjective set shown with no rank numbers, no consensus math, no voting |
| `'votes'` | Fan vote list — no Sources tab, no Rankings tab. The "Back to Rankings" button on the vote UI is automatically hidden for this mode since there are no rankings to return to. |

### `links`
Optional in general, but **required for `mapsCity` lists** (see the linking note under `linkType`). Maps item names to direct URLs. The key must match the exact item-name string, parenthetical and all. When a direct link exists, the site uses it instead of the auto-generated search link.

For product lists, point to specific Amazon URLs:
```javascript
links: {
  'Sony WH-1000XM6': 'https://amzn.to/XXXXXXX',
  'Bose QuietComfort Ultra': 'https://amzn.to/XXXXXXX',
}
```

For `mapsCity` lists, point to a sanitized Google Maps **search** URL (parentheses, commas, semicolons and ampersands removed, then URL-encoded; encode any apostrophe as `%27` so it is safe inside the single-quoted JS string):
```javascript
links: {
  'Amanoi (Vinh Hy Bay, Vietnam)': 'https://www.google.com/maps/search/?api=1&query=Amanoi%20Vinh%20Hy%20Bay%20Vietnam',
  'The Setai, Miami Beach': 'https://www.google.com/maps/search/?api=1&query=The%20Setai%20Miami%20Beach',
  "Red's Eats": 'https://www.google.com/maps/search/?api=1&query=Red%27s%20Eats',
}
```
Cover the union of all item names in the list — every name appearing in any source and in `vote.items`.

### `sources`
The expert publication rankings that drive Borda scoring. Rules:
- Always include the `ai` seed source (required by the data structure, ignored by scoring).
- **Use more than two sources whenever more exist — required, not optional.** Search broadly and gather every credible ranked/unordered list you can find before building; never settle for two if a third, fourth, or fifth is findable. Two sources is acceptable ONLY when you've genuinely confirmed no more exist (a niche brand/topic). More sources always produce a more reliable consensus.
- Each source list can have any number of items — not limited to 10.
- The source `label` is shown to users on the Sources tab. Include the year: `'Condé Nast Traveler 2024'` not just `'Condé Nast Traveler'`.
- Source IDs are internal only (e.g. `cntraveler`, `michelin`, `infatuation`).
- Sources must be **real and verifiable**. Do not invent rankings.
- Sources must be **recent** — published within the last 2–3 years. A 2019 ranking is not acceptable. **For food and restaurant lists, at least one editorial source must be dated the current calendar year or the prior year.** If all existing sources predate that window, replace the oldest one rather than just adding to it.
- Every item in every source must match the tier of the list (see Quality rules below).
- **Every list MUST carry a ranking element — at least one ordered source is mandatory** (the only exception is `mode: 'unranked'` lists, which are curated by hand and intentionally have no consensus math). A list whose sources are ALL unordered (every source flagged `"unordered": true`) is NOT allowed: with no rank signal the Borda math collapses to a frequency/alphabetical tally and the "By the Rankings" view becomes meaningless. When the editorial sources for a topic happen to all be unordered, add at least one platform-rating source that genuinely ranks the items:
  - **Asia: Tabelog replaces Yelp as the priority platform for Japan.** Yelp has no real presence in Japan; for any Japanese food & drink list (Tokyo, Kyoto, Osaka...), **Tabelog is the priority rating platform: always include it, and list it first**, with Google Reviews second. Order by Tabelog score descending (review count as tiebreak), label e.g. `'Tabelog · Ranked by Rating (June 2026)'`, and do NOT flag it `"unordered"`. ⚠️ Gather scores from the tabelog.com **business page itself** (the score is plain text in `.rdheader-rating__score-val-dtl`), never from Google snippets — snippets are ambiguous and often show the wrong listing's score. Watch for 【移転】 ("moved") pages: a relocated restaurant has a stale old listing and a current one; use the current flagship (most-reviewed, non-moved) page — this caught Kanda and Sushi Saito on the Tokyo no-budget list. For **mainland China**, the local platform is Dianping, which is NOT usable (verified June 2026: dianping.com serves a Meituan slider-CAPTCHA bot wall on first page load, and completing CAPTCHAs is not permitted), and Google/Yelp have no real presence there (single-digit review counts) — ship those lists editorial-only and note it to the owner rather than feeding in junk ratings.
  - **Regional platform map — which rating platform is the priority, by geography (researched June 2026).** Yelp's real review depth exists only in the **US and Canada**; everywhere else a different platform is the local consensus signal. Before building any food/drink, bar, or lodging list, check this table and use the local incumbent as the priority rating platform (listed first), with Google Reviews as the secondary unless noted. The same live-gathering rules apply (business page, never snippets; never guess; ordered source, never `"unordered"`).

    **Restaurants & bars:**

    | Geography | Priority platform | Notes |
    |---|---|---|
    | US, Canada | **Yelp** (+ Google) | The default rule below |
    | Japan | **Tabelog** (+ Google) | Full workflow in the bullet above; Yelp absent |
    | Mainland China | **Dianping** — NOT usable | Bot-walled (see above); Google/Yelp absent. Ship editorial-only and tell the owner |
    | South Korea | **Naver Place** (+ KakaoMap) | Naver reviews are receipt-verified; Google is genuinely weak in Korea. Read scores off the Naver Place page live; if Naver proves ungatherable, treat like China (editorial-only, tell the owner) |
    | Hong Kong / Macau | **OpenRice** (+ Google) | The Tabelog of HK; numeric smile/score and review counts on openrice.com business pages |
    | Thailand | **LINE MAN Wongnai** (+ Google) | wongnai.com ratings; Google secondary |
    | Vietnam | **Foody.vn** (+ Google) | Verify gatherability before relying on it; fall back to Google |
    | India | **Zomato** (+ Google) | Zomato dining ratings out of 5; Swiggy Dineout secondary |
    | Taiwan, Singapore, rest of SE Asia | **Google** | No dominant local incumbent (Burpple in SG is niche); Google carries the signal |
    | Russia / Central Asia | **Yandex Maps** (+ 2GIS) | Google reviews thin since 2022; verify gatherability first |
    | Western Europe (FR, ES, IT, PT, BE, NL, CH, DK, SE) | **Google** (+ TheFork) | TheFork (TripAdvisor-owned) has ratings + review counts for restaurants; use it as the second platform where coverage exists |
    | UK, Ireland, rest of Europe, LatAm, Middle East, Africa, Australia/NZ | **Google** (+ TripAdvisor) | Google default; TripAdvisor as the second signal where useful |

    Bars skew toward Google everywhere: the local food apps (Tabelog, Naver, Wongnai, Zomato) are food-first and cover bars unevenly, so for bar/nightlife lists outside the US lean on Google as the primary and use the local platform only where it genuinely lists bars.

    **Lodging (hotels/resorts):** Google + TripAdvisor work almost worldwide and remain the default pair, but prefer the regional incumbent's review corpus where one dominates: **Rakuten Travel and Jalan** in Japan; **Ctrip/Trip.com** in China (roughly two-thirds of online hotel bookings; verify gatherability); **Naver/Yanolja** in Korea; **Agoda** in Southeast Asia and Taiwan; **MakeMyTrip/Goibibo** in India; **Yandex Travel/Ostrovok** in Russia; **Booking.com** review scores in Europe and as the global fallback. As with Dianping, if an incumbent can't be gathered live (bot wall, login wall), don't fake it — use Google + TripAdvisor and note the gap to the owner.

    Like every platform rule here, gatherability must be verified live the first time a platform is used; record what works (selector, URL pattern) in this file the way the Tabelog workflow is recorded.
  - **Pick the platform by category.** For **food & drink** — restaurants, coffee shops, bars, bakeries, cafés — **Yelp is the priority platform: always include it, and list it first.** **Google Reviews is the secondary platform and should be included too** — both are considered. (For non-food place lists — hotels, shops, attractions — lead with Google and add TripAdvisor where relevant.) Two rating platforms beat one; they balance each other, since Yelp typically runs about half a star below Google.
  - Order each platform source by aggregate rating (rating descending, review count as the tiebreak). **Review-count floor:** any place with 100+ reviews is considered "established" — within that tier, ties in star rating break alphabetically rather than by review count, so a new excellent spot with 150 reviews is not systematically outranked by an older one with 3,000 reviews at the same rating. Only below 100 reviews does raw count still tiebreak (very sparse data is genuinely less reliable). Gather the ratings **live through the connected Chrome browser** — never from memory or search snippets (the same no-guessing rule used for chain-city lists). On Yelp, confirm you're reading the flagship listing (the one with the most reviews), not a stray duplicate — pull rating + review count from the business page when the search card is ambiguous.
  - **Minimum-review floor: a venue with fewer than 25 reviews is sorted by the source average, not its own rating (owner rule, 2026-06-10).** A rating from a tiny sample is noise; a 5.0 from 1 review or a 4.8 from 9 must not top a rating source over a 4.7 from 500. So when ordering ANY review-count rating source (Yelp, Google, TripAdvisor, Amazon, Goodreads, and the regional platforms), first split the source's venues into **qualifying** (>=25 reviews) and **sparse** (<25). Compute `base` = the average star rating of the qualifying venues, and assign every sparse venue that `base` value for ordering (insufficient data reverts to the source mean). Then sort by effective rating descending, with: qualifying venues tie-broken by the existing 100-review rule (100+ -> alphabetical, else review count descending); the sparse block (all sharing `base`) kept together and tie-broken among themselves by review count descending, then alphabetically; and a qualifying venue placed above a sparse one when they tie at exactly `base`. The sparse venue still appears in the source (it is NOT dropped) and keeps its real `itemYelp`/links: only its ordering position changes. This is a GATHER-TIME ordering rule, not an engine change: review counts are not stored in `lib/data.js`, so the engine cannot apply it; bake the corrected order into the source's `items` array when you build or re-gather it. Edge cases: a venue with exactly 25 reviews QUALIFIES (the threshold is strictly fewer than 25); if a source has zero qualifying venues, fall back to raw rating order and note it. This is SEPARATE from and STACKS WITH the 100-review tiebreak floor above (25 governs average-substitution; 100 governs the alpha-vs-count tiebreak among qualifying venues). First applied 2026-06-10 to `ski-resort-bars-world` (Tio Bob's 4.8/21 reverted to mid) and `croissants-montreal` (Aube 5.0/1 and La Petite 4.8/9 demoted out of the consensus top 10); the full retrofit across existing rating sources requires re-gathering review counts and is an ongoing sweep.
  - **Central rating-data store: stamp every rating you read into `lib/rating-data.js` (owner rule, 2026-06-10).** Whenever you gather or re-gather a venue's rating + review count for ANY review-count rating source (Yelp, Google, TripAdvisor, Amazon, Goodreads, regional platforms), you MUST record it IN THE SAME DEPLOY as `RATING_DATA[listId][itemName][platform] = { rating, count, date }`, where `date` is the YYYY-MM-DD you read it, `itemName` is byte-for-byte the canonical `lib/data.js` name (parentheticals and all), and `platform` is one of `yelp` / `google` / `tripadvisor` / `amazon` / `goodreads` / the regional platform id (`tabelog`, `openrice`, etc.). The newest reading overwrites the prior one for that platform (keep the latest date). This archive is the ONLY place the as-read rating and review count are persisted, so it is what makes the sub-25-review floor, the planned source-recency multiplier, re-seeds, and audits runnable WITHOUT a live re-gather. NEVER gather ratings without stamping them here, and keep a rating source's `items` order consistent with the stored numbers. The store is seeded (2026-06-10) with `ski-resort-bars-world` (Google) and `croissants-montreal` (Yelp); every future rating gather appends/updates it.
  - **⚠️ Yelp bot wall on a cold MCP tab (June 2026, `best-restaurants-seaport-boston`):** a fresh, cookie-less MCP browser tab almost always trips Yelp's "Verifying the device..." PerimeterX challenge (it even froze the CDP renderer once), so `yelp.com/biz/...` pages usually CANNOT be read directly, and the challenge must NOT be solved (it is a bot gate). **HARD RULE (owner, 2026-06-09): the moment the "Verifying the device..." wall appears, STOP gathering and ask the owner to log into Yelp in the connected browser, then resume.** A logged-in / warm Yelp session normally clears the device challenge, after which `yelp.com/biz/...` business pages read directly via their JSON-LD `aggregateRating` (rating + review count) and you can gather every venue cleanly from the real source. Do this BEFORE falling back to anything else, and never try to solve or click through the challenge yourself. Only if the owner-login still does not clear the wall, fall back to the **Bing knowledge panel**: `bing.com/search?q=<venue> <city> <cuisine>`, wait ~3s, read the Ratings card. Bing renders the count as EITHER `(347 reviews)` OR `(347)` (regex for both), and Yelp's value is half-star. Bing covers most venues but not all; the ones it has no Yelp card for, Google's "Reviews from the web" also usually lacks (it shows OpenTable/Grubhub/Facebook), so for those stragglers have the owner paste rating + count (the blocklist workflow). Gather **Google** ratings the reliable way from the flagship Google Maps *place* page: `google.com/maps/search/<venue>+<city>`, wait ~4s, confirm the `h1` matches the venue, and read the first `X.X (N)` headline in body text; the result-list cards (`Name · X.X stars · N reviews`) also hand you neighboring venues' Google ratings for free. Lead with Bing for Yelp, Maps for Google.
  - Label each as an ordered source, e.g. `'Yelp · Ranked by Rating (May 2026)'` and `'Google Reviews · Ranked by Rating (May 2026)'`, and do NOT set `"unordered": true` on them.
  - **Breweries and other destination venues get all THREE rating platforms — Yelp + Google + TripAdvisor — where available (owner ruling, 2026-06-06).** Breweries, wineries, distilleries, beer halls, cideries, and similar food/drink places people visit as a *destination* carry genuine TripAdvisor review depth (unlike a typical neighborhood restaurant), so they get a third ranked rating source: add a `tripadvisor` source labeled `'TripAdvisor · Ranked by Rating (Month YYYY)'` (ordered by rating descending, review count as tiebreak, NOT `"unordered"`) PLUS `itemTripadvisor` business-page URLs for the hover menu, alongside the usual Yelp (first) and Google (second). Order of inclusion: Yelp, then Google, then TripAdvisor. Omit any individual item a platform has no real listing for (it is normal for some breweries to lack a TripAdvisor page). **Reliable gathering:** the Bing knowledge panel (`bing.com/search?q=<venue> <city> tripadvisor`) surfaces the Yelp AND TripAdvisor rating + review count AND the real TripAdvisor business URL in a single search (wait ~1.2s for the entity panel to render). Google ratings are NOT in Bing's panel; gather them from the flagship Google Maps *place* page and confirm the resolved place title + a sane review count, because a Maps search-list can return a secondary/stale pin (e.g. a famous brewery showing only a few dozen reviews is the wrong listing). Adding TripAdvisor reshuffles the Borda consensus, so always recompute, re-seed `ai` + `vote.items`, and add a hero image for any item that newly enters the top 3.
  - Only include items already on the list (every item in a ranked source needs a `links` entry). It's fine to omit a place a platform has no real presence for.
  - After adding rating-based sources, re-seed `ai` and `vote.items` so they reflect the blended consensus (editorial frequency + Yelp + Google), not a single signal.
  - **Weighting:** the engine supports an explicit numeric `"weight"` on any source (engine change d909e63, honored in `lib/helpers.js` and all three mirrors; fractional values like `0.5` work). Every source defaults to weight 1, and "Yelp prioritized" is implemented by always including Yelp and listing it first, not by extra weight. Generalist menu-item lists down-weight both rating platforms to 0.5 each: see "Menu-item lists at generalist venues" below.
- **The Infatuation sources — only the SCORED spots are a ranking; never rank the unscored ones below them (owner clarification, 2026-06-09).** The Infatuation assigns a numeric 0–10 score (e.g. `8.4`) to SOME spots in a guide, NOT all of them. For an Infatuation source, "ranked" means **the spot has a published score** — a score is the only thing that establishes order. Encode each guide as up to two sources: (a) a RANKED source containing only the **scored** spots, ordered by score descending, labeled e.g. `'The Infatuation Boston · Best Italian 2026 (by 0–10 score)'` (do NOT flag it `"unordered"`, and do NOT trust the guide's on-page running order); and (b) the **unscored** spots as a SEPARATE companion source flagged `"unordered": true` (equal flat points), or omitted entirely. **An unscored spot is NOT inferior to a scored one** — the Infatuation simply didn't give it a number, and an unscored spot can be better than a scored one. So never append unscored spots beneath the scored ones as if lower-ranked, never sink them to the bottom of the ranked array, and never infer any order among them. A guide where only one or two spots are scored is therefore a mostly-unordered source with a tiny ranked head: encode the 1–2 scored items as the ranked source and put everything else in the unordered companion (this mirrors the breweries editorial-picks + reader-map split). Ties among scored spots break by review recency or list order. (This supersedes the earlier "place unscored spots last or omit" guidance, which wrongly treated unscored = worst; retrofit any source encoded that way, e.g. `burgers-boston`'s "Neptune Oyster scored 9.0, rest unranked".)

  ⚠️ **The scores are PICTURES, not text — this trips people up constantly.** On almost every Infatuation guide the 0–10 number is a rendered image/graphic, not selectable text. That means `web_fetch` and `get_page_text` come back with the writeup but NO number, so the spot looks unscored when it isn't. **Never read Infatuation scores with a text fetch.** Instead, in the connected Chrome:
  1. Open the guide (or the spot's own review page) and take a **screenshot**.
  2. Visually read the score off the badge next to each spot; `zoom` into it if it's small.
  3. If the guide badge is unclear, open that spot's individual review page — the big 0–10 number sits near the top of the page.
  Only treat a spot as genuinely unscored after the **rendered** page also shows no number. Do not guess a score, and do not infer it from the article's running order.

### Menu-item lists at generalist venues: down-weight the rating platforms (owner rule, 2026-06-07)

A Yelp/Google star rating rates the VENUE, not the dish. On lists where the venues are specialists (most pizza and bagel lists, dedicated burger shacks), the venue rating is a fair proxy for the dish and the rating sources work as designed. On dish lists dominated by venues with a bigger identity than the dish, the venue rating measures the whole dining experience and injects noise into a single-dish ranking. This includes burgers at steakhouses and gastropubs, pasta at full-menu restaurants, and wings, which are usually bar food where the rating scores the bar (TVs, beer list, service), not the kitchen.

**Classification, run once per menu-item list (any list with a `picsTerm`):** for each item in the candidate pool, ask the litmus question: would a local describe this place as "a [dish] spot" (specialist) or "a bar/restaurant that happens to have great [dish]" (generalist)? A sports bar with famous wings is generalist even if the wings are its claim to fame, because its reviews rate the bar. If **half or more** of the pool is generalist, the list is a **generalist dish list**.

- **Specialist list:** no change. Yelp + Google at full weight 1, per the standard rules.
- **Generalist dish list:** still gather and include both rating platforms (the HARD PUBLISH GATE is unchanged), but set explicit `"weight": 0.5` on each rating-platform source, so the two platforms combined carry the weight of one editorial source instead of two. Make the down-weight reader-visible in the source label itself: append `· 0.5x Weight` before the date, e.g. `'Yelp · Ranked by Rating · 0.5x Weight (June 2026)'` (owner request, 2026-06-07). The same 0.5 applies to a regional platform substituting for Yelp (Tabelog, OpenRice, etc.). Record the classification and the rough specialist count in a comment above the sources so future sessions do not silently reclassify.
- **Dish-specific true experts are the preferred fix, not down-weighting.** A source that scores the dish itself (One Bite for pizza, Johnny Novo for NYC burgers) is immune to this problem; always search for one when building a generalist dish list, and keep its full trueExpert weight.
- **Gathering and ordering are unchanged** (live gathering, rating descending, review-count tiebreak, 100+ review floor). Only the weight changes.
- **Venue-type lists are out of scope** (dive bars, steakhouses, breweries, hotels, cocktail bars, live-music bars): there the venue is the subject, so the venue rating is the right signal at full weight.
- Changing a weight reshuffles the Borda consensus, so recompute, re-seed `ai` + `vote.items`, and backfill descriptions/heroes for any new top-10/top-3 entrants, exactly as when adding a source.

### `vote.items` — DEPRECATED (2026-06-18)
Native voting was removed (see the "NATIVE VOTING REMOVED" note at the top of this file).
There are no `vote` blocks in `lib/data.js` anymore; do not add or seed `vote.items`. Re-seed
`ai.items` only. This section is retained for historical context.

~~Exactly 10 items. These seed the voting UI before live Supabase data loads. Must be the same quality tier as the expert sources.~~

---

## Content Rules

### "Best" means best — not cheapest

For hotels, products, restaurants, and any list where quality has a clear hierarchy:
- **Best = highest quality, most prestigious, most acclaimed.**
- Best does not mean best value. Best does not mean best for the budget traveler.
- A luxury hotel list must contain only luxury hotels. No Marriott Courtyard, no Holiday Inn, no Hilton Garden Inn — even if they top a TripAdvisor popularity ranking.
- A fine dining list must contain only fine dining. No fast casual, no chains, no "hidden gem" budget spots.
- If a source you want to use contains off-tier items, either drop that source or replace the off-tier items with appropriate ones before adding it.

### Product lists: Best = Best, never the value pick (owner ruling 2026-06-05)

"Best for the money" is NOT "best." Editorial roundups are value-ordered and the Amazon
ratings source is price-blind, so without correction a "Best X" product list drifts toward
budget picks. Two mandatory mechanics on EVERY product list:

1. **Drop budget-category editorial slots.** When a category-pick roundup labels a slot
   "best budget," "best cheap," "best value," or "best under $X," that item is OFF-TIER for
   a "Best X" list. Remove it from that source before encoding (same treatment as off-tier
   hotels). If an item's ONLY editorial appearances are budget slots, remove it from the
   list entirely (links, amazon source, seed, vote). An item picked in a budget slot in one
   guide but a non-price slot in another stays, minus the budget-slot appearance. Form-factor
   and use-case slots (best compact, best portable, best for desks) are NOT budget slots.
   Ranked lab tables (TechGearLab/OutdoorGearLab scores) are kept whole: their cheap items
   rank low on merit already.
2. **The 'Lineup Positioning · Ranked by Launch Price' source is REQUIRED on every product
   list where price tracks quality tier** (electronics, appliances, luggage, gear), with
   explicit `"weight": 2`. Skip it only where price does not track quality (condiments,
   snack flavors, cookies, books, **board games**) and note the skip to the owner. The
   Amazon Reviews source stays at weight 1.

First applied 2026-06-05 to `soundbars` and `home-projectors`. Still owed the same retrofit:
`bluetooth-speakers`, `air-purifiers`, `drip-coffee-makers`, `carry-on-luggage`,
`womens-running-shoes` (and verify each source's category labels live before dropping).

**Board games — price is NEVER a quality signal here (owner rule, 2026-06-10).** Across
every board game list (strategy, family, party, kids, adults, etc.), the pricing source
is BANNED. The reasoning: board game price tracks production complexity and rules weight
(a heavy 4-hour euro costs $80, a brilliant 20-minute party game costs $25), but the
heavier game isn't "better" — they serve different purposes, and a cheap classic like
Codenames is genuinely best in its category. Treating price as a quality proxy
structurally biases the consensus toward heavy/expensive games (Frosthaven, Twilight
Imperium) over equally-loved lighter picks (Codenames, Splendor, Catan), even after
down-weighting. Do NOT add a `pricing` source OR a `prices` map to any board game list,
and do NOT cite "price tracks quality tier" as a rationale on this category. First
applied 2026-06-10 to `strategy-board-games` and `best-board-games-for-adults`.

### No large chains on "best of" food lists

**Rule of thumb: never include a large chain on a best-of food list, anywhere.** In-N-Out, Chipotle, Shake Shack, Five Guys, Original Tommy's-scale regional chains, and the like do not belong on a "Best Burgers in X" or any other best-of food/drink list, even when editorial sources include them (sources love a nostalgic chain pick). When a source includes a chain item, drop it from that source before adding — same treatment as off-tier items. This applies to the `ai` seed, every source's `items`, `vote.items`, `links`, `itemLinks`, and `itemYelp` alike. (The single-city chain-ranking lists, e.g. `best-run-chipotle-manhattan`, are the deliberate exception: the chain IS the topic there.) A small local mini-chain with a handful of locations in one metro (e.g. a beloved 3-location taqueria) is not a "large chain" — judgment applies; the test is whether the place reads as a mass-market chain rather than a local institution.

**Borderline calls: keep the item and FLAG it for the owner — never remove unilaterally.** When a place sits in the gray zone (a corporate-owned single location, a regional chain of ambiguous scale, a beloved local institution that grew), leave it on the list, complete its data (links/itemYelp/etc.) as normal, and flag it in the session notes/progress doc for the owner to rule on. Only clear-cut mass-market chains (In-N-Out, Chipotle, Shake Shack tier) get dropped without asking. Owner rulings to date: **The Capital Burger (Back Bay)** stays on `burgers-boston` despite being a Darden-owned Capital Grille spinoff (single Boston location, fine-dining execution); Tasty Burger (5 local Boston locations) is an allowed mini-chain.

### Major-city "best restaurants" lists are sit-down (full-service) only (owner rule, 2026-06-10)

On a catch-all **"Best Restaurants in [City]"** list, whether counter-service / fast-casual / order-at-the-counter spots qualify depends on how deep a dining destination the city is. The bar scales with the city's stature:

- **Major dining cities (NYC, LA, Chicago, SF, Boston, DC, Miami, and the like):** the list must contain **sit-down, full-service restaurants only** (a server takes your order at the table). Counter-service spots, slice shops, walk-up counters, and fast-casual do NOT belong, however acclaimed, because there are far more than ten genuine full-service restaurants to fill the list. Example: **L'Industrie (a pizza slice counter) cannot appear on Best Restaurants in New York.** Those spots still belong on their own dish/category list (best pizza, best tacos, best bagels), just never on the catch-all "best restaurants" list.
- **Secondary / smaller markets (Jacksonville and the like):** counter-service IS acceptable, because the market is thinner and an excellent counter-service spot is genuinely among the city's best places to eat. Example: **Dockside (counter-service) stays on Best Restaurants in Jacksonville.**

Judgment applies on which bucket a city falls in; the two examples above are the codified precedents. This rule applies ONLY to the catch-all "best restaurants in [city]" lists. Dish-specific and category lists (best pizza/burgers/tacos/bagels/etc.) are unaffected, since counter-service is the norm there. When removing a counter-service spot from a major-city list, pull it from every field (`ai` seed, each source's `items`, `vote.items`, `links`, `itemLinks`, `itemYelp`/`itemTripadvisor`, `prices`) and backfill the `ai` seed/`vote.items` to 10 with a sit-down spot already in the sources, per the universal source/item cleanup checklist.

**Outstanding retrofit:** audit every shipped `best-restaurants-<city>` list set in a major dining city for counter-service entries and remove them per the cleanup checklist. The Jacksonville `Dockside` keep is the codified precedent for the secondary-market side.

### Nuanced "Best" categories

Some categories require a more considered definition of "best":

- **Dive bars:** Best means most authentic, most character, most storied — not fanciest. A "best dive bars" list should contain actual dive bars, not upscale cocktail bars.
- **Street food:** Best means most iconic, most beloved by locals — not most expensive.
- **Budget travel:** Best means best within the budget category.
- **Cocktail bars:** A "best cocktail bars" list must contain venues whose primary identity is a *bar with a serious cocktail program*. A **cocktail bar can absolutely serve food** (oysters at Maison Premiere, small plates at Bar Blondeau or Layla, even pizza) and still belong, as long as drinks are the main draw. What does NOT belong is a **food-first restaurant** where the cocktails are a side act, i.e. a place people go primarily to eat a full meal (a brasserie, a full-service restaurant, a taqueria, etc.) even if it has a nice bar. Litmus test: would a regular describe it as "a bar" or "a restaurant"? Wine bars are drink-first and may stay; they are not the target of this rule. When removing a food-first restaurant, pull it from every field (`ai` seed, each source's `items`, `vote.items`, `links`, `itemLinks`, `itemYelp`) and backfill the seed/vote to 10 with genuine cocktail bars that already appear in the sources. (Example: Le Crocodile, the Wythe Hotel's French brasserie, was removed from `cocktails-williamsburg`.)

Read the list title and apply the most natural definition of "best" for that specific category. When in doubt, ask.

### Hotels and resorts: five-star standard

For any list titled "Best Hotels," "Best Resorts," or similar accommodation list:
- **Default tier is five-star (or equivalent luxury).** This means Forbes Five-Star, AAA Five Diamond, Small Luxury Hotels of the World, Leading Hotels of the World, Relais & Châteaux, or independently acclaimed luxury properties of demonstrably equivalent product and service. No four-star chain hotels, no "boutique-but-budget," no properties that rank well on TripAdvisor popularity but don't meet the luxury threshold.
- **Exception for niche or underserved destinations.** In destinations where no five-star properties exist (a small island, a remote area), the best genuinely available, critically acclaimed properties qualify. Note this context in the blurb.
- Off-tier items contaminate the consensus for the whole list. When a source includes non-five-star properties, drop those items from the source before adding it — even if they rank highly in the publication's list.
- **Large resort complexes are not automatically five-star.** A sprawling all-inclusive or destination-resort-with-condos requires the same scrutiny: does it meet the luxury product and service standard, or is it just large and popular?

### Pricing as a quality signal for hotel and resort lists

Nightly rate is a meaningful proxy for hotel quality — properties that command the highest prices in a market do so because of superior product, service, and demand. Use live pricing as an additional Borda source:

- **Gather live rates 5–6 months out** using Google Hotels or a major booking site, through the connected Chrome browser — never from memory. Use the cheapest available room for a **Tuesday or Wednesday night** in a **non-holiday period** 5–6 months from today. To identify a safe date: count forward 5–6 months, then check that the chosen week is not within 7 days of a major holiday (US Thanksgiving, Christmas/New Year's, Easter, school spring break peak, local national holidays). If it lands too close to a holiday, move one week earlier or later.
- **Add an ordered `pricing` source** ranked by nightly rate descending (highest rate = rank 1). Label it `'Live Pricing · 5–6 Months Out (Month YYYY)'` — do NOT set `"unordered": true`.
- **No online rate for the date? Rank it in the UPPER HALF of the pricing source — do not omit it or rank it last.** Ultra-exclusive properties (Aman, Cheval Blanc, Eden Rock, Cap Juluca, many small Relais & Châteaux) often sell only direct/on-request and show "Contact this property" on Google Hotels with no bookable nightly rate. A missing OTA rate signals exclusivity, not cheapness, so these belong in the upper half of the price ranking. Place them beginning at the list's midpoint rank (e.g. rank 11 of 21), so they sit at the top-half boundary rather than being inflated above the most expensive *available* properties, and order them alphabetically among themselves. Never drop a no-rate property from the pricing source or sink it to the bottom — that would wrongly read as 'cheap.'
- **Tiebreak:** when two properties are editorially equivalent across other sources, the higher-priced one wins.
- **Cost-of-living adjustment for global-scope lists.** A $400/night room in Hanoi and a $400/night room in New York City represent radically different quality levels. For lists spanning multiple countries or regions with substantially different cost-of-living baselines (e.g., "Best Hotels in Asia," "Best Budget Resorts Worldwide"):
  - Express each property's rate as a **multiple of the local luxury floor** — i.e., the cheapest available five-star hotel in that same destination on the same date.
  - A hotel priced at 3× its local luxury floor is equivalent to one at 3× the New York luxury floor — both signal exceptional demand and quality within their market.
  - Rank the pricing source by this multiple, not by absolute dollar figure.
  - For single-region lists where all properties price in the same market context (e.g., Caribbean resorts, European ski chalets, Maldives overwater villas), this adjustment is not needed — absolute USD rates are directly comparable.
- **Caveat:** the pricing source carries equal Borda weight with any other source. It is one signal among several, not the whole answer. Always combine it with at least two editorial sources.
- **Displaying the nightly price (do NOT embed it in item names).** Store each item's nightly rate in a `prices` object on the list (`{ 'Jumby Bay Island (Antigua)': '$3,357/n', 'Eden Rock (St. Barths)': 'rate on request' }`) and let the UI append it. The price is shown ONLY when the pricing source is the selected view on the list page (via `priceDecorate` in `DetailClient`), never in the consensus view, the vote tab, the share poster, or the home-page tile. Item names themselves stay clean (`'Jumby Bay Island (Antigua)'`) so the price never leaks into other views and never becomes part of the link/vote key. Re-gathering prices then only touches the `prices` map, not every name.

### Source requirements

- Sources must be **real and verifiable**. Web-search to confirm they exist before adding them.
- Sources must be **recent** — within the last 2–3 years. Check the publication date. **For food and restaurant lists, at least one editorial source must be dated the current calendar year or the prior year** — this ensures new excellent openings appear in at least one guide.
- The source label must accurately name the source and year: `'The Infatuation NYC 2024'`, not `'The Infatuation'`.
- **Always use more than two sources when more are available — this is a hard rule, not a suggestion.** One source means no real consensus; two is weak and allowed only when no third credible source exists anywhere. Before finalizing ANY list, search broadly (editorial guides, local press, rated guides, reader polls, roundups) and add every credible source you find. For well-covered topics (city restaurant lists, popular products, big hotel brands) expect 4-6+ sources, not the bare minimum.
- **EVERY list MUST include at least one editorial / expert-publication source — never ship a list whose only sources are user-rating platforms.** Yelp, Google, TripAdvisor, Amazon, and Goodreads *ratings* are user-review signals that SUPPLEMENT editorial sources; they do not replace them. A list built from only rating platforms plus the `ai` seed is incomplete and must not be deployed. This applies to NEW food/drink and location lists too (breweries, bagels, restaurants, bars): gather at least one real published "best of" ranking (Eater, The Infatuation, Time Out, Serious Eats, a respected local paper or city magazine, a beer/brewery publication, etc.) and order it correctly, IN ADDITION to the Yelp/Google rating sources. If editorial pages are paywalled or JS-only, get the ranking from another readable source or have the user paste it (see the blocklist workflow) — do not skip the editorial source. The rating platforms are the second axis, not the whole list.
- **At least THREE expert/editorial publications per list is REQUIRED — the only exception is when fewer genuinely exist.** Three is the floor, not a target: before finalizing ANY list, search broadly and gather at least three real published rankings from different outlets. Do not ship a list with one or two editorial sources just to save effort. You may ship with fewer ONLY when a genuine, thorough search confirms a third (or second) credible publication does not exist for that topic — and in that case you MUST tell the user how many you found and that more do not appear to exist, so they can decide. "Two is acceptable" is no longer the rule; two (or one) is acceptable only when three do not exist. For well-covered topics (city food/bar lists, popular products, major hotel brands) expect to find 3-6+ and include at least three. User-rating platforms (Yelp/Google/TripAdvisor/Amazon/Goodreads) do NOT count toward this editorial count.
- Prefer authoritative sources: Michelin, Condé Nast Traveler, Travel + Leisure, Eater, The Infatuation, Robb Report, Forbes, Time Out, etc.

### Source scope must MATCH the list's scope — no sub-scope sources (owner rule, 2026-06-07)

A source may only be fed into a list when its geographic coverage matches or exceeds the list's
geography. **Never use a source scoped to a sub-geography of the list** (a neighborhood roundup on a
city list, a single-city roundup on a state/country list, a one-region roundup on a world list).
Such a source awards points exclusively to its own sub-geography and ZERO to every equally good item
elsewhere in the list's scope, structurally biasing the Borda consensus toward that area. This holds
for ranked AND unordered sources alike (an unordered one still hands its flat score only to its own
neighborhood). The trigger case: a "Boston Magazine · Best North End Restaurants" source on
`best-italian-restaurants-boston` was silently subsidizing North End spots over Cambridge/South End
contenders; it was removed 2026-06-07.

- **The reverse direction is fine.** A citywide source on a neighborhood list is usable: keep only
  the items inside the list's geography, preserving their relative order (the source stays ranked).
- **Category scope follows the existing off-tier rules.** A category-wider source (e.g. "best
  restaurants" on a "best Italian" list) is usable only after filtering to on-category items; a
  category-narrower source ("best pizza" on a "best restaurants" list) is banned for the same
  one-sided-subsidy reason as geography.
- **Hub-neighborhood districts are NOT an exception by default.** Even when a scene genuinely
  concentrates in one district (Frenchmen Street live music, Golden Gai dive bars), a district-only
  source still discriminates against out-of-district contenders. Prefer citywide sources; keep a
  district source only with explicit owner approval, recorded in the session notes.
- **Remediation when found on a live list:** follow the universal "Dropping a source" checklist
  below — the same cleanup applies, the only difference is the reason.

### Dropping a source — universal cleanup checklist (owner rule, 2026-06-09)

**Dropping a source is NEVER just deleting it from `sources`.** Every removal touches the consensus,
which cascades into the seed, vote, link maps, descriptions, and hero images. A source-drop that
leaves any of these out of sync is incomplete and silently rots the list. This checklist applies
universally — whatever the trigger (sub-scope violation, off-tier items, dead URL, owner ruling,
publication redacted, you name it). Same steps every time, no exceptions.

When dropping a source, execute ALL of these in the SAME deploy:

1. **Remove the source entry** from `list.sources` in `lib/data.js`.
2. **Recompute the Borda consensus** (mirror `getSources` in `lib/helpers.js`: absent items earn 0
   from a source, NO average credit; unordered flat scoring; top-10 cap). Never paste a stale
   computeConsensus from a mirror — re-read helpers.js before scoring.
3. **Re-seed `ai` items and `vote.items`** to the new consensus top 10, in the new order. Both arrays
   stay at 10 (backfill from the next-best on-tier items if the source carried items that no other
   source did, per the "Tier backfill" rule).
4. **Prune orphaned link/asset keys** for any item that no longer appears in ANY source AND is not
   in `vote.items`. Touch every map: `links`, `itemLinks`, `itemYelp`, `itemTripadvisor`, `prices`.
   An item that survives in another source stays; a key with no remaining anchor is dead weight and
   must go. (This is the symptom that surfaced the rule: `best-wings-nyc` had 18 orphan `links` keys
   from past item drops, and `pacific-ocean-resorts`, `best-bottomless-brunch-lower-manhattan`,
   `dive-bars-sydney`, `air-purifiers` each carried one.)
5. **Backfill descriptions for newly-entering top-10 items** in `lib/descriptions.js`. Items that
   EXIT the top 10 keep their descriptions — they're harmless fallbacks. Items that move WITHIN
   the top 10 already have theirs.
6. **Add a hero image for any item newly entering the top 3** in `lib/hero-images.js` (`{src, credit,
   creditUrl}` per the gathering pipeline). Items that drop OUT of the top 3 keep their hero entries.
7. **Ship as ONE multi-file commit** (data.js + descriptions.js + hero-images.js, plus any orphan
   pruning) so the activity ledger's "Sources Revisited" same-deploy fold-in catches the removal
   correctly. Don't split into separate deploys — that creates two ledger cards and a misattributed
   ranking change.
8. **Post-deploy pings:** trigger `/api/cron/consensus-check` (so the removal-cause attribution lands
   the same day) AND IndexNow for the affected list URL.

The activity ledger then auto-renders the removed source struck-through under "Sources Revisited"
(both per-list `ActivityFeed.jsx` and universal `/feed`) via `removedSources` from `/api/list-feed`
— no manual ledger entry needed. If a removal is a long-standing rule violation (e.g. sub-scope),
add a `sourceRevisions` note explaining why per the rule below.

**Pre-deploy verification:** run the orphan audit (`Object.keys(list.links).filter(k => !inUse.has(k))`
across all link maps) on the spliced data.js before pushing. Zero orphans = the cleanup is complete.

### Source-rule changes ALWAYS carry a note, applied uniformly across the logs (owner rule, 2026-06-09)

**Any time you change a source rule for a list, you MUST record a `sourceRevisions` note explaining
WHY, and apply the same explanation uniformly to every list affected by that change.** This is a hard
rule, not a courtesy. "Source rule change" is broad and covers, at minimum: a weighting change (e.g.
down-weighting Yelp/Google to `0.5` on a generalist dish list), a re-encoding (flipping a source to
`unordered`, `rankedHead`, or a tier/award encoding), removing a source (scope too narrow, off-tier,
unreadable), a label/edition refresh, and adding or dropping a `trueExpert` flag. If the reason isn't
obvious from the data alone, it needs a note.

- **Where the note lives:** `list.sourceRevisions` in `lib/data.js`, keyed by the affected source id
  (e.g. `"yelp"`, `"google"`, `"infatuation"`, or a since-removed id like `"bostonmagne"`). Phrase it
  as a reader-facing correction, e.g. `"Correction (June 2026): ..."`.
- **It must render uniformly in BOTH activity ledgers** — the per-list one (`app/list/[id]/ActivityFeed.jsx`)
  and the universal one (`app/feed/page.js` + `app/feed/FeedClient.jsx`). The note attaches to the
  Re-encoded bubble (a refreshed/re-weighted source), the Source removed card, and the folded
  Removed/Re-encoded bubble inside a Sources Revisited card. If a code path shows a changed source
  without surfacing its note, that's a bug to fix in both mirrors, not a reason to skip the note.
- **Apply it everywhere the same rule fired.** When one rule change touches many lists (the generalist
  dish-list 0.5x down-weight is the canonical case), every affected list gets the corresponding note
  for each changed source — never just the list you happened to be looking at. Search out the full set
  and cover it in the same pass. (Canonical 0.5x wording, adapt the dish/platform to the list:
  `"Correction (June 2026): Yelp and Google rate the whole venue, and most spots on this list are bars
  and full restaurants rather than burger spots, so both rating sources now carry 0.5x weight per the
  generalist dish-list rule."`)
- **The note explains; it never substitutes for the mechanics.** Still make the actual rule change
  (set `"weight"`, `"unordered"`, remove the source, etc.), recompute consensus, re-seed, and refresh
  descriptions/heroes as the specific rule requires. The note is the audit trail on top.
- **Reuse the existing wording when one already exists for the same kind of change** rather than
  inventing a new phrasing each time, so the logs read consistently.

### Source item ordering — order is rank, so order it correctly

**The order of items inside each source IS its ranking.** Borda scoring reads position: the 1st item in a source array gets that source's top score, the 2nd gets the next, and so on. So the array order directly drives the consensus. Getting it wrong silently corrupts the result. Before saving any source, confirm its items are in true best-to-worst order.

**Verify the real published order — do not trust the order things appear in the article.** Many publications present spots in an order that is NOT their quality ranking. The on-page sequence may be editorial flow, neighborhood grouping, "newest additions first," or alphabetical. Always look for the publication's own ranking signal and sort by that:

- **The Infatuation (and any rated guide):** each spot carries a **numeric score** (e.g. `9.1`, `8.4`). The article frequently lists higher-scored spots *lower down the page* and vice-versa. **Order the source items by the numeric score, descending — never by the order they appear in the article.** Break ties by the on-page order. List unrated/unscored spots last. (This caught us once: Infatuation NYC showed Taqueria Ramirez at 9.1 far down the page while a 8.2 spot appeared near the top.)
- **Explicitly numbered lists** ("1. … 2. …", "The 20 best, ranked"): the numbers ARE the order — use them directly.
- **Alphabetical or unordered lists** (Texas Monthly's taco trail, many "10 best" roundups with no scores or numbers): the order carries **no quality signal**. Do one of: (a) find a different version of the list that is ranked, (b) drop the source, or (c) keep it but **label it as alphabetical/unordered in the source `label`** (e.g. `'Texas Monthly · 22 Best Taco Spots (alphabetical) 2026'`, `'The Points Guy (unordered roundup)'`) AND set `"unordered": true` on that source object (see the flat-scoring rule below). Never silently feed an alphabetical list in as if its order were a ranking.

### Unordered sources score FLAT, not by rank — set `"unordered": true`

When a source's order is NOT a ranking (alphabetical, "in no particular order," an unordered roundup, or a set of "best in class" picks), it must contribute **equal flat points to every item it lists** — never rank-decaying Borda points. Two requirements, both mandatory:

1. **Label it** so it's transparent: `(alphabetical)` or `(unordered roundup)` in the source `label`.
2. **Flag it** with `"unordered": true` on the source object. This is what actually changes the scoring — the label alone does nothing.

How the scoring works (implemented in `lib/helpers.js` `getSources`, `scripts/generate-og-images.js`, and the OG/Twitter image routes `app/list/[id]/opengraph-image.js` and `app/list/[id]/twitter-image.js` — keep all four in sync):
- A **ranked** source gives `11 − rank` points: 10 to its #1, 9 to #2, … 1 to #10, 0 beyond.
- An **unordered** source (`"unordered": true`) gives every item it lists an **equal flat score that scales with the source's size**, and 0 to items it doesn't list. The budget is **what those `n` items could earn at the top of a ranked top-10 list**, split evenly (helper `flatUnordered(n)`):
  - **`n` ≤ 10:** budget = `10+9+…+(11−n)`, so `flat(n) = (21 − n) / 2`. 1 item → 10 (a ranked #1), 3 items → 9 each (avg of 10+9+8), 5 → 8, 9 → 6, 10 → the classic 5.5.
  - **`n` > 10:** budget stays at the full 55 (`FLAT_BUDGET`, = 10+9+…+1) split across all `n`: `flat(n) = 55 / n`. 16 items → ~3.44 each, 50 → 1.1, 2000 → ~0.03. Inclusion on a huge unordered list is a near-meaningless signal, and scores like one.
  - No unordered mention can ever exceed a ranked source's #1 (10 pts) — the n≤10 formula maxes out at 10.
- To change the formula, edit `flatUnordered` / `FLAT_BUDGET` in all four files (keep them in sync).

Example (Four Seasons list): The Points Guy's worldwide "16 best" roundup is unordered, so it's labeled `'The Points Guy (unordered roundup)'` with `"unordered": true`; each of its 16 properties gets 55/16 ≈ 3.44, while the five genuinely-ranked sources drive the order.

### Ranked-head sources: one (or a few) scored items atop an otherwise unranked roundup — `rankedHead: N`

Some guides score only their top pick(s) and present the rest unranked (e.g. the 2026 Infatuation
Boston burger guide shows a 9.0 badge on Neptune Oyster and a 7.8 on JM Curley while the other eight
spots carry no score). Encode these with `"rankedHead": N` on the source: the FIRST `N` items in the
array earn normal Borda rank points (10, 9, ...) and every remaining item earns the flat unordered
score for a roundup of the tail's size (`flatUnordered(tailCount)`). Notes:

- Order the head by the published scores, highest first; the tail keeps the page's order (it earns a
  flat score, so its order is cosmetic).
- Note the basis in the label, e.g. `'The Infatuation Boston 2026 (Neptune Oyster scored 9.0, rest unranked)'`.
- Do NOT also set `"unordered": true` — `rankedHead` takes precedence and handles the tail itself.
- Implemented in `lib/helpers.js` `getSources` and all three mirrors (`scripts/generate-og-images.js`,
  `app/list/[id]/opengraph-image.js`, `app/list/[id]/twitter-image.js`) — keep all four in sync.
- First used on `burgers-boston` (owner ruling 2026-06-07: only Neptune ranks; JM Curley's 7.8 was
  offered as a #2 head slot and the owner declined, so it scores flat with the tail).

### Tiered award lists (Winners / Runners-up / "Voters Also Loved") are RANKED, not unordered

Some publications (e.g. Tampa Magazine's annual Best Restaurants awards) publish tiers instead of a numbered list. Tiers ARE a rank signal, so do NOT encode these as `"unordered": true` flat sources (that pays a bottom-tier mention the same as a Winner). Encode the source as a ranked list: tier order first (Winners, then Runners-up, then the bottom tier), alphabetical within each tier, and note the basis in the label, e.g. `'Tampa Magazine Best Sushi 2026 (by award tier)'`. Include ALL published tiers, and never cherry-pick within a tier — including one "Voters Also Loved" spot while omitting another from the same tier is exactly how Noble Rice went missing from `best-sushi-tampa-bay` (fixed 2026-06-04; encoding owner-approved that day).

**When unsure how a source is ordered, fetch the actual page and check** — look for scores, rank numbers, or an "in no particular order" disclaimer. If the page is paywalled or JavaScript-only and the real order cannot be read, follow the rule below.

### Never guess an order or a list

If a source is paywalled, renders as a JavaScript shell with no readable content, serves the wrong article body, or otherwise cannot be read, **do not reconstruct its list or its order from memory or from search snippets.** Either (a) obtain the list from another readable place, (b) drop that source, or (c) substitute a comparable readable source. Fabricated or guessed orderings are worse than one fewer source.

### Never demote an unreadable ranked source to "unordered" — you must KNOW a list is unordered to treat it as one

`"unordered": true` is a factual claim about a source: that the publication itself presents its items in no rank order (alphabetical, "in no particular order," an unordered roundup). It is NOT a fallback for a source whose order you couldn't read. If a publication actually RANKS its items but the ranking is hidden from you (paywalled, login-gated, JS-only, the order rendered as an unreadable image, etc.), you have NOT confirmed it is unordered, so you may not encode it as an unordered flat source. Doing so silently fabricates a "this source has no rank signal" claim that is false, and pays every listed item the same flat score when the publication actually ranked them.

Example: if Consumer Reports ranks a category but their ratings sit behind a paywall, you cannot see the order, so you may NOT add CR as an unordered source that simply lists the items. You either get the real ranked order from a readable place, or you drop the source entirely. The same applies to any ranked-but-unreadable publication.

The only valid path to `"unordered": true` is positive confirmation from the readable page itself that the source presents its items without a rank: an explicit "in no particular order" disclaimer, visible alphabetical ordering, or an unordered-roundup format. When you can't read the source at all, treat it as unreadable and follow the "Never guess an order or a list" rule above (get the order elsewhere, drop it, or substitute a readable source). Never invent either the order OR the absence of order.


### Blocked-fetch domains (e.g. travelandleisure.com) — have the user paste the list

Some domains are on a **fetch blocklist** and return `HTTP 403 — "URL is on blocklist"`. This is a content-access restriction, not a rendering problem, so it applies to **every** retrieval method — `web_fetch`, the Chrome browser tools, and shell commands (`curl`/`wget`/Python) alike. Do **not** try to route around it with Chrome, archives, caches, or mirror sites; that is not permitted. (The Chrome browser is only for pages that genuinely load but render their content via JavaScript — not for blocklisted domains.)

The correct, rules-compliant workflow when a blocked page looks like a good source:
1. **Notify the user** that the page is blocked and can't be retrieved by any tool.
2. Ask them to **open it themselves and paste or screenshot** the relevant content (e.g. the ranked list) into the chat. Claude can read a pasted screenshot directly, so a screenshot of the list is perfectly fine.
3. Build the source from what they provide, and still set the source's `url` to the original page so its chip/button links there.

This is exactly how the **Travel + Leisure World's Best Awards 2025 hotel-brands** ranking was added to `best-luxury-hotel-brands-world` (T+L is blocklisted; the user pasted the top‑25, and the source links to the travelandleisure.com article). Known blocklisted domains so far: `travelandleisure.com`.

### Parenthetical context — REQUIRED, scaled to the list's geographic scope

Every item on a **location-based** list (restaurants, bars, hotels/resorts, beach clubs, schools, venues, etc.) MUST carry a geographic parenthetical. The **form** of that parenthetical depends on how wide the list's geography is — always give the reader the next level of detail beyond the list's own scope:

| List scope | Example list | Parenthetical form | Example item |
|------------|--------------|--------------------|--------------|
| **Neighborhood** | Best Dive Bars in Greenpoint; Best Cocktail Bars in SoHo | **none** | `'Spritzenhaus 33'`, `'Pegu Club'` |
| **City** | Best Pizza in NYC; Best Dive Bars in Atlanta | `(neighborhood)` | `'Lucali (Carroll Gardens)'`, `'Northside Tavern (West Midtown)'` |
| **Country / state / region** | Best Resorts in Turkey; Best Private Schools in Florida | `(neighborhood, city)` | `'Mandarin Oriental Bodrum (Yalıkavak, Bodrum)'`, `'Ransom Everglades School (Coconut Grove, Miami)'` |
| **World / continent** | Best Aman Resorts in the World; Best Beach Clubs on the Mediterranean | `(city, country)` | `'Amanpuri (Phuket, Thailand)'`, `'Nikki Beach (Saint-Tropez, France)'` |

Rules:
- **Neighborhood-scope lists take NO geographic parenthetical.** When the list's title already names a single neighborhood (e.g. `Best Dive Bars in Greenpoint`, `Best Cocktail Bars in the West Village`, `Best Dive Bars in the East Village`), every item is already in that neighborhood, so a `(neighborhood)` tag would just repeat the list scope. Leave these item names bare. Add a parenthetical only where one genuinely disambiguates two similarly-named spots, never as a blanket geographic tag.
- For every wider scope, this is **mandatory** for every location item, not just for disambiguation. A city-level list with bare names (`'Lucali'`) is incorrect — it must read `'Lucali (Carroll Gardens)'`.
- The parenthetical is part of the **canonical item name**: it must be byte-for-byte identical across the `ai` seed, every source's `items`, `vote.items`, and the keys of the `links` object. Build the Maps URL from the full `name + parenthetical`.
- **Non-location lists** (products, films, games, etc.) take no geographic parenthetical — use a clarifying parenthetical only where it genuinely helps (`'Tsuta (first Michelin-starred ramen)'`).
- Renaming an existing item (e.g. adding a parenthetical) **changes its fan-vote key** (`listId::item name`). When you retroactively re-parenthesize a list that already has votes, migrate each existing vote to the new name (re-post it under the new key) so the votes aren't orphaned.

Beyond geography, still be generous: add a parenthetical wherever it clarifies the item or disambiguates similar names (`'The Ritz-Carlton (South Beach)'` vs `'The Ritz-Carlton (Key Biscayne)'`).

### Naming & labeling conventions — addenda (learned in practice)

These refine how to apply the parenthetical rules above. They are universal — follow them on every list.

- **Strip a trailing comma-locator before adding the parenthetical.** If an item name already ends with a `", <place>"` locator (e.g. `'Perivolas, Santorini'`, `'Verbier, Switzerland'`, `'The Setai, Miami Beach'`), remove that trailing locator and replace it with the scaled parenthetical — `'Perivolas (Oia, Santorini)'`, `'Verbier (Valais, Switzerland)'`, `'The Setai (South Beach)'`. Never keep both the comma-locator and the parenthetical. (A genuine brand suffix that isn't a locator stays, e.g. `'Grace Hotel Santorini, Auberge Resorts Collection (Imerovigli, Santorini)'`.)

- **Don't duplicate a locale that's already in the name.** If the resort's own name already contains the locale the parenthetical would name, drop that element to avoid literal repetition. For **world/continent** scope `(city, country)`: when the city/island is in the name (`'Four Seasons Resort Bora Bora'`, `'Le Taha'a by Pearl Resorts'`, `'COMO Laucala Island'`), use just `(country)` → `'Four Seasons Resort Bora Bora (French Polynesia)'`. Use the full `(city, country)` only when the name does **not** already contain the city/island (`'The Brando (Tetiaroa, French Polynesia)'`). Minor repetition of the *country* alone is acceptable when it adds a finer locale (`'Six Senses Fiji (Malolo Island, Fiji)'`).

- **When the list's items are themselves places (towns/regions), shift one level finer.** A ski-resort list (`Best European Ski Resorts`) has towns as items, so the literal `(city, country)` would just repeat the item. Use `(region, country)` instead — the administrative region/canton/department/state: `'Verbier (Valais, Switzerland)'`, `'Courchevel (Savoie, France)'`, `'Kitzbühel (Tyrol, Austria)'`, `'Val Gardena (South Tyrol, Italy)'`.

- **Match the list's existing diacritic style.** If a list already ASCII-izes names (e.g. Turkish resorts written `Bodrum`, `Yalikavak`, `Ciragan`), use ASCII in the parentheticals too (`(Golturkbuku, Bodrum)`). If a list keeps diacritics (`Kitzbühel`, `Val d'Isère`), keep them in the parentheticals (`(Graubünden, Switzerland)`). The Maps link builder percent-encodes either correctly.

- **Collapse duplicate entries for the same property.** If two item strings refer to the same place (e.g. `'Laucala Island Resort, Fiji'` and `'COMO Laucala Island'` after an operator change), keep one canonical name across the whole list.

- **Migrate user-submitted "extras" too, via the admin endpoint.** Renaming a seed/source item to add a parenthetical orphans any matching row in the `extras` table (e.g. a fan-added `'The Newbury Boston'`). Rename the extra with the admin `POST /api/admin/extras/rename` (`{listId, oldName, newName}`), which **atomically moves the extra, its aggregated vote score, AND its activity-ledger rows** — since migration `18_rename_extra_ledger_propagation.sql` (2026-06-07) the RPC also updates `vote_events.item_name`, `consensus_alerts.item_name`, and the stored `consensus_snapshots.top10` array, so a rename is reflected site-wide including both activity ledgers and never leaves the old name behind (the Lulu Sag Harbor case) or fires a spurious exited/entered pair on the next cron run. Because that RPC moves the vote, do **not** also re-post that item's vote through `/api/votes` — that would double-count. (Seed/source items that are *not* extras still migrate via `/api/votes` as described above.)

- **Items must match the list's defining geography.** Before re-parenthesizing, confirm every item actually belongs in the list's scope. A `Best Pacific Ocean Island Resorts` list must not contain Indian Ocean resorts (Maldives, Seychelles); remove off-geography items and rebuild the sources from verifiable, recent, correctly-ranked publications rather than leaving a mislabeled list.

- **Drop permanently-closed locations.** A "best" list must only contain places that are currently open. When working a list, verify open status (a quick web check — watch for "permanently closed" on Google/Yelp/Tripadvisor, or a closure announcement) and remove any closed item everywhere it appears: the `ai` seed, every source's `items`, `vote.items`, and the `links` keys. If the removed item was in the `ai` seed or `vote.items` (which should stay at 10), replace it with another currently-open, on-tier place so those stay at 10; removing it from a source alone just shortens that source, which is fine. (Example: Ensenada in Williamsburg closed Oct 2025 and was dropped from `tacos-nyc`.)

### Titles
- Must start with a descriptor that implies a ranked list (Best, Most, Worst, Top-Grossing, Largest, etc. — owner rule 2026-06-07).
- Title case throughout.
- No clickbait or superlative stacking ("Most Incredible Best-Ever").

### Blurb
- 1–2 sentences. Specific, editorial, no filler.
- Good: `'Private pools, limestone karsts, and turquoise waters. The Andaman Sea and Gulf of Siam are home to Thailand's most coveted beachfront sanctuaries.'`
- Bad: `'A list of the best hotels in Thailand for luxury travelers looking for the best experience.'`

---

## List page structure: one tabbed page (owner rule, 2026-06-07; ranking render rewritten 2026-06-18)

`/list/[id]` is the ONLY list page. Tabs under the header switch the content below in place (no
navigation), in this exact order and user-facing wording (the unchanged internal tab keys are in
parentheses): **The Ranking** (`consensus`, default), **Sources** (`source`), **Methodology**
(`method`), **Activity** (`activity`). Two more controls sit in the header row to the RIGHT, as
buttons rather than tab chips: **Share** (opens the share UI; `tab === 'share'`, rendered by
`SnapshotClient` with its `embedded` prop) and the **Disagree?** modal trigger (user-facing label;
the internal complain / Request-Review machinery and the `#vote` view are unchanged). The Activity
ledger renders ONLY in its Activity tab. The old `/list/[id]/rankings` page permanently redirects to
`/list/[id]`; `#sources`, `#vote`, `#activity`, and `#share` hashes survive the redirect and open
the matching tab. Implementation: `ListDetail` in `DetailClient.jsx` owns the tabs and the page
container (`maxWidth: 1180`); **the default `consensus` tab renders `RankingView.jsx`** (see next
section), `SourcesPanel` / `MethodologyPanel` (from `MethodPanels`) render Sources / Methodology,
`ActivityFeed` renders Activity, and `SnapshotClient` (embedded) renders Share. The standalone
`/snapshot/[id]` page still works for old links and automations.

⚠️ The ranking tab no longer renders through `ListOverview` / `LedgerRow` (the layout the prior
version of this section described, now superseded). `DetailClient` still imports `ListOverview`, but
its DEFAULT export is no longer the live ranking render. The named export `ListOverviewPoster` (in
`ListOverview.jsx`) IS still live: it is the SHARE POSTER, rendered by `SnapshotClient`, and still
uses the `LedgerRow` / `HeroTile` / `SmallTile` ledger layout. So the live ranking page and the
share poster are now SEPARATE renders with different layouts and palettes (see the mirror note).

### Ranking tab layout: RankingView.jsx "podium" + rest (Option B, owner-approved 2026-06-18)

The Ranking tab renders through **`app/list/[id]/RankingView.jsx`**, which has its OWN visual
system, deliberately distinct from the site cream / Fraunces / ember magazine theme: font is
**Manrope**, accent / primary is **blue `#2563eb`**, cards are **white on a `#f7f8fa` ground**, and
the rank badges are **gold / silver / bronze medals** (`MEDAL = ['#e8b43a','#b8bcc4','#c8814b']`). A
local `C` token object holds these colors. When mocking up or extending this page, match THESE
tokens, not `COLORS` from `lib/data.js` (the first mockup attempt used cream / Fraunces and looked
nothing like the live page). Container width is 1180px (`DetailClient.jsx`).

Top-3 "podium" treatment is **Option B**, which replaced an earlier text-over-photo overlay the
owner flagged 2026-06-18 as unreadably murky (name / chips / score were layered on the photo under a
dark gradient, so a mediocre photo read as muddy). The rule now: photos NEVER carry overlaid text or
a darkening gradient. Each podium item is a horizontal white card with the **photo in its own frame
on the left** and the name, consensus score, publication chips, description and action row on white
to the right. **#1 is the lead card** (full width, ~42% photo column, 24px name); **#2 and #3 are a
paired compact row below** (`.rv-pgrid`, two equal cards, ~40% photo column, 17px name), collapsing
to one column with photo-on-top on mobile (`<=680px`, via `.rv-pcard` / `.rv-pphoto`). The medal
badge sits in the photo's top-left corner. Below the podium, **"The Rest of the Ranking"** renders
ranks 4-10 as compact rows (rank numeral + name / locality + description for the top 10 + chips +
action row). A list with fewer than 3 ranked items shows just the lead (plus a single full-width
second card). This render path also serves `mode: 'facts' / 'scores' / 'unranked' / 'votes'` lists
(the non-consensus branches inside `RankingView`).

Per-item plumbing is shared with the rest of the site: `RankingView` imports `buildLinks` and
`picsConfig` from `ListOverview.jsx` (its `ActionRow` builds the Map / Website / Pics + video / buy
chips the same way), and reads `HERO_IMAGES` / `DESCRIPTIONS` by exact item name. `containHero`
(product / tech / `heroFit: 'contain'`) still letterboxes the photo on a dark fill.

**Mirror discipline (changed 2026-06-18):** the live ranking page (`RankingView.jsx`) and the share
poster (`ListOverviewPoster` -> `LedgerRow` / `HeroTile` in `ListOverview.jsx`) are now SEPARATE
renders. A visual change to the live ranking tab is made in `RankingView.jsx`; a matching change to
the downloadable / social share image is made separately in `ListOverview.jsx`. They are NOT
auto-synced, so decide per change whether the poster needs the same treatment. (`picsConfig` in
`ListOverview` and `entryPicsConfig` in `DetailClient` remain the per-item pics-config helpers; the
shared link/pics builders `buildLinks` / `picsConfig` are imported by both render paths.)

---

## Affiliate Links

### Digital Rent / Buy buttons for movie & song lists (`itemBuy` + `buyLinks`)

Media lists (movies, songs) carry per-item affiliate **purchase** chips alongside their
primary link (the IMDb "View" / YouTube "Listen" link stays — these are *added*, not a
replacement). The buttons are Amazon digital links carrying the `cgurus-20` tag, but **the
retailer is NEVER named on the button** — the labels are just `Rent` / `Buy` (films) or `Buy`
(songs). First applied 2026-06-10 to `john-hughes-movies`.

- **`buyLinks` (list-level flag):** `'video'` renders **two** chips, `Rent` and `Buy`, both
  pointing to the same item URL (an Amazon Video title page shows rent AND buy options on one
  page, there is no separate rent-only deep link). `'music'` renders a single `Buy` chip. Omit
  the flag and no chips render.
- **`itemBuy` (per-item URL map):** keyed by the exact item-name string (byte-for-byte, with the
  year/parenthetical), value = `https://www.amazon.com/dp/<ASIN>?tag=cgurus-20`. For films the
  ASIN is the **Amazon Video** title page; for songs the **Amazon Digital Music** (MP3) track
  page. Cover the union of every source's items plus `vote.items`.
- **Gather ASINs LIVE via Chrome, never guess.** Search `amazon.com/s?k=<title>&i=instant-video`
  (films) or `&i=digital-music` (songs), take the matching result's `/dp/` or `/gp/video/detail/`
  ASIN, and **verify ambiguous titles on the detail page** (year + director/cast) — remakes,
  sequels, and same-named films are common (the 1991 *Dutch* resolves to an unrelated 2021 crime
  film; *Miracle on 34th Street* has 1947 and 1994 versions).
- **If a title has no Amazon digital page, omit it from `itemBuy`** (its chip just doesn't show) —
  never fabricate an ASIN. It is normal for a few obscure titles to lack a page (e.g. *Reach the
  Rock* and the 1991 *Dutch* are not on Amazon Video, so they carry no Rent/Buy chip).
- **These links are affiliate links: render with `rel="...sponsored"`.** Purchase chips do not
  affect Borda consensus, so adding/refreshing them needs no re-seed, cron, or IndexNow ping.
- **Renders in BOTH mirrors** — `DataRow`/`buildAuxLinks` in `app/list/[id]/DetailClient.jsx`
  (filled-ink `buyChip`) and `LinkRow`/`buildLinks` in `app/list/[id]/ListOverview.jsx`
  (`linkBtn(true)`). Keep the two logic-identical, like `itemVideo`.

### Amazon products
- Use `linkType: 'amazon'` for all physical product lists.
- The site auto-generates Amazon search links using the affiliate tag `cgurus-20`.
- Auto-generated search URL format: `https://www.amazon.com/s?k=PRODUCT+NAME&tag=cgurus-20`
- For direct product links (better for conversion), use the ASIN: `https://www.amazon.com/dp/ASIN?tag=cgurus-20`
- Store direct links in the `links` object, keyed by the exact item name string.
- **If an Amazon product page exists, you MUST link to it directly via `/dp/<ASIN>?tag=cgurus-20` — never ship a product or book list with `s?k=` search links as a placeholder or shortcut.** Essentially every in-print book and product has a product page, If an item has NO Amazon listing at all (direct-only / MAP-protected brands, products not yet released on Amazon), link it to a **Google search** (`https://www.google.com/search?q=<item+context>`) — never an Amazon `s?k=` search. For books, the product page is the **Kindle edition**: find it with an `&i=digital-text` search, read its `data-asin`, and link to `/dp/<ASIN>`. Gather ASINs live via Chrome; do not guess. (This is a hard rule: a list shipped with search links when product pages exist must be fixed.)

### Amazon reviews as a ranking source (product lists)
- **Every product list (`linkType: 'amazon'`) should include an Amazon-ratings source as a ranking element**, the same way food & drink lists use Yelp/Google. Amazon star ratings are the buyer-consensus signal for products.
- Gather each product's **Amazon star rating (out of 5) and review count live** through the connected Chrome browser (search the product, open the listing) — never from memory. Order the source by rating descending, then review count as the tiebreak. (A 4.7 with 30,000 ratings outranks a 4.7 with 200.)
- Label it `'Amazon Reviews · Ranked by Rating (May 2026)'` and do NOT flag it `"unordered"`.
- Combine it with editorial "best of" review sources (Wirecutter, Good Housekeeping, CNET, Serious Eats, Reviewed, etc.). Re-seed `ai` and `vote.items` to reflect the blend of editorial picks + Amazon rating, not a single signal.
- This applies to physical products (air fryers, headphones, etc.) and to product-style media sold on Amazon (cookbooks, books) where an Amazon rating exists.

### Tech product lists: measured experts, lineup positioning, and day-one models

Flagship tech lists (TVs, headphones, monitors, etc.) have a structural bias problem: editorial "best of"
roundups are value-ordered (the mid-range model wins "best for most people" while the flagship sits lower
as "best premium pick"), and a just-launched successor has no reviews at all, so it earns zero Borda and
sinks below the two-year-old models it supersedes. Three rules fix this — first applied to `oled-tvs`
(June 2026):

1. **Measured/judged expert sources are True Experts — order them by their measurement, flag
   `"trueExpert": true`.** A source that ranks products by instrumented lab measurement or a formal judged
   shootout outranks listicles, exactly like the Infatuation score rule. For TVs the canonical one is the
   **Value Electronics TV Shootout** (annual, judged by professional calibrators, official results PDF on
   valueelectronics.com) — order by composite score. Find the equivalent for other categories where one
   exists (e.g. a formal measured group test). ⚠️ **RTINGS numeric scores are membership-gated as of 2026**
   — every score box renders blurred for non-members and the values are not in the page HTML, so they
   cannot be gathered live. Do NOT reconstruct RTINGS scores from memory; use their public "Best X"
   roundup as a normal ranked source instead (its pick order is readable) and rely on a different
   measured/judged source for the trueExpert slot.

2. **Add a "Lineup Positioning · Ranked by Launch Price" source on every flagship-tier tech list** — the
   tech analog of the hotel pricing source. Manufacturer launch MSRP (use one consistent size/config, e.g.
   the 65" TV) is an objective quality-positioning proxy and the one signal a day-one product has in full.
   Gather launch MSRPs live (manufacturer press releases, launch-pricing articles), order descending, and
   give the source the id **`pricing`** so `DetailClient` shows the price decoration on that view. Store
   the prices in the list's `prices` map as e.g. `'$3,399 launch'`. Tie-break equal prices by newer
   generation first, then alphabetically. Do NOT flag it `"unordered"`. Like the hotel rule, it carries
   one normal Borda weight: it nudges, it does not dictate.

3. **Day-one model policy.** When a direct successor (LG G6 after the G5, etc.) has launched but has few
   or no reviews yet: include it on the list, carried by the positioning source (and any source that has
   covered it), and let the daily consensus-alert cron surface it as reviews land. Never fabricate a
   ranking for it, never inherit the predecessor's editorial positions, and never leave the current
   flagship generation off a "Best X" list entirely — a tech list missing the newest flagship reads as
   stale. Expect the successor to start mid-to-low and climb as coverage arrives.

Tech lists also rot faster than other lists (annual model cycles, spring launches). When touching a tech
list more than ~6 months old, re-check each source for an updated edition and re-gather the Amazon-ratings
source.

### Goodreads ratings as the user-review source for book lists
- **Every book list must include a Goodreads average-rating source as its User Ratings & Reviews element**, exactly the way physical-product lists use Amazon ratings and food lists use Yelp/Google. Goodreads is the reader-consensus signal for books, and a Goodreads rating should be added to ALL book lists where one is available.
- Gather each title's **Goodreads average rating (out of 5) and ratings count live** through the connected Chrome browser (open the book's Goodreads page) — never from memory. Order the source by rating descending, then ratings count as the tiebreak.
- Label it so the classifier routes it into "Reviews & Ratings Aggregations", e.g. `'Goodreads · Ranked by Rating (Reader Reviews)'`. The grouping in `app/list/[id]/DetailClient.jsx` (`expertGroupKey`) keys off the words `rating`/`reviews` in the label, so always include one of those words; do NOT flag it `"unordered"`.
- **A curated Goodreads editorial/themed LIST (e.g. a "Best Historical Fiction" Listopia) is NOT a user-rating source, it is an Expert Publication.** Label those plainly with no `rating`/`reviews` keyword so they group under Expert Publications, e.g. `'Goodreads · Great Finance Novels (Fiction)'`. The distinction: an aggregate star rating = user reviews; a hand-curated list = editorial.
- A book may carry BOTH an Amazon rating source and a Goodreads rating source (two user-review signals, like Yelp + Google). Where a book has no Goodreads presence, omit it from that source.

### What counts as "Reviews & Ratings Aggregations" (the source group)
The Sources tab groups every source by `expertGroupKey` in `app/list/[id]/DetailClient.jsx`. The third group, **Reviews & Ratings Aggregations** (renamed from "User Reviews & Ratings" 2026-06-09, since it also covers critic aggregators), catches any aggregated review/rating signal -- user OR critic -- and ALL of the following route here:

- **User-rating platforms:** Yelp, Google Reviews, TripAdvisor, Amazon Reviews, Goodreads, OpenTable, Booking, Expedia, etc. (matched by id/label hint or by the words `rating` / `reviews` in the label).
- **Readers' polls / Readers' Choice:** any source label containing the word `readers` (T+L Readers, Condé Nast Traveler Readers' Choice, Newsweek Readers' Choice, Boston.com Readers' Poll, Business Traveller Readers' Poll, etc.). A readers' poll is an aggregated reader vote, not an editorial pick. Exception: the publication "Reader's Digest" (id `readersdigest`, singular possessive) is a normal editorial outlet and stays in Expert Publications -- the classifier excludes that exact id.
- **Critic aggregators:** Rotten Tomatoes / Tomatometer, Metacritic / Metascore (matched by id/label hint).
- **Pricing** is its own group (`pricing`), not part of this one.

**Hyperlink behavior:** sources in Reviews & Ratings Aggregations render the chevron-arrow link on the caption whenever a `url` is present (`isPublicationLink` was loosened 2026-06-09 to include the `platform` and `pricing` groups). So a CNT Readers' Choice writeup, a Rotten Tomatoes editorial guide, a T+L Readers article, a Goodreads ratings page, a Yelp / Google / TripAdvisor / Amazon listing URL, or the pricing search all link out where the source carries a URL. Only the internal `composite` (`ai`) group and the live fan vote (`cgvote`, which has no URL) stay non-linking. Always store the most useful destination URL on the source (the readers' poll article, the rating-platform list page, the live-pricing search), since it will be reader-facing.

### Direct Amazon product links (`/dp/<ASIN>`) and live data gathering
- **If an Amazon product page exists, you MUST use the direct product link, not a search link.** For every product/book whose Amazon listing can be found (essentially all of them), the `links` value must be the canonical product URL `https://www.amazon.com/dp/<ASIN>?tag=cgurus-20`, never an `s?k=` search URL. The `cgurus-20` affiliate tag is all that is needed for attribution. A search link is a last resort reserved for items with no product page at all.
- **Edition preference for the product link: Kindle first, then paperback, then hardcover.** A book usually has multiple Amazon ASINs (one per edition). Always link to the **Kindle** edition's `/dp/<ASIN>` when it exists (search `"<title> <author> kindle edition"` and take the `B0…`-prefixed ASIN — Kindle ASINs start with `B0`, print ISBNs are 10 digits). If there is genuinely no Kindle edition, fall back to **paperback**, and only then **hardcover**. Do NOT reuse a print ASIN harvested from an editorial roundup page (those are usually hardcover/paperback) when a Kindle edition exists — gather the Kindle ASIN explicitly. (This was missed once on `sports-memoirs`, where six titles' ASINs came from the Celadon list and pointed at hardcover; they were re-gathered as Kindle.)
- **Gather the ASIN, rating, review count, and price live through the connected Chrome browser** (read the `data-asin` attribute and the rating/reviews block off the organic, non-sponsored search result you are using). Never guess an ASIN. If a product has no genuine Amazon listing (direct-only / MAP-protected brands such as Nuna, Zoe, La Marzocco, ECM, Lelit, Slayer, etc., or models not yet stocked), link it to a **Google search** (`https://www.google.com/search?q=<item+context>`, with a context word like 'stroller' or 'OLED TV' in the query) and omit it from the Amazon-ratings source. Amazon `s?k=` search links are never used for items: every item link is either a direct `/dp/<ASIN>` product page or a Google search.
- **The Amazon Creators API and any client secret are NOT used by the assistant for this.** The browser method above supplies links, ratings, reviews, and ranking with no credential, and the build sandbox cannot reach external APIs anyway. Never store an API secret in the repo and never paste one into chat; keep any credentials file outside `C:\\dev\\source-of-truths` (e.g. in the OneDrive project folder, gitignored) or, better, in a password manager.

---

## Per-entry hover link menu (`itemLinks`)

**Scope: location-based lists only** (hotels, resorts, restaurants, bars, cafes, beach clubs, venues, and any other place a person physically visits). Non-location lists (products, films, TV, games, books, music, factual rankings, etc.) do NOT get the hover menu, since Map / Website / photo links are meaningless for them. Simply do not add `itemLinks` to those lists.

**REQUIRED on every new location-based list — not optional.** Building a location list (restaurants, bars, hotels, cafes, beach clubs, venues, etc.) is not finished until it carries an `itemLinks` object, gathered live, the same way the `links` object is mandatory. Treat it as a standard build step for all future list searches: after assembling the sources and `links`, gather each item's official website and add `itemLinks` before deploying. The only location lists that legitimately ship without `itemLinks` are ones whose items are not individual businesses with their own site (e.g. a list of *towns* like `best-hamptons-towns`).

A location-based list opts into the list-page hover menu by adding an `itemLinks` object mapping each exact item name to its official **Website** URL (gathered live, never guessed). When present, hovering a ranked entry reveals: **Website** (from `itemLinks`), **Map** (the existing `mapsCity` link), and a category-specific "pics" group built automatically from the item name + neighborhood:

**Rule: the pics label is always a plain `Pics:` for EVERY category — food lists included.** (The old convention gave food-type restaurant lists a `Food Pics:` label; that was retired 2026-06-05 for consistency and ease. Never reintroduce `Food Pics:`.) What still varies by category is the chip set, per the priority order below.

The priority order in `entryPicsConfig` (highest to lowest):
1. **Venue keyword match** (title/id contains `brewer`, `beach club`, `winer`, `distiller`): `Pics:` with `Yelp` and `Google`. Add new venue types here.
2. **Bars / nightlife** (`bars` or `nightlife` tag): `Pics:` with `Yelp` and `Google`. Checked *before* food to keep the branch order identical in both mirrors.
3. **Food venues** (`type: 'food'` OR `food`/`food-drink` tag, and no bar tag): `Pics:` with `Yelp` and `Google`. Only reaches this branch if not a bar or venue.
4. **Hotels / resorts** (`type: 'travel'` or `travel`/`luxury` tag): `Pics:` with `TripAdvisor` and `Google`.
5. **Default fallback**: `Pics:` with `Yelp` and `Google`.

The `Google` link defaults to Google **Image** search (`&tbm=isch`) so it lands on photos directly, not a web-results page. Only the Website per item needs gathering; Map / Yelp / Google / TripAdvisor are constructed from the name. Implemented in `buildAuxLinks` and `entryPicsConfig` in `app/list/[id]/DetailClient.jsx`. The reveal uses a generous `max-height` so wrapped chips are not clipped on mobile.

**⚠️ The overview page has a SECOND copy of this logic: `picsConfig` in `app/list/[id]/ListOverview.jsx`. Any change to `entryPicsConfig` (new venue keyword, label rule, priority order) MUST be applied to BOTH functions, logic-identical.** This duplicate drifted once: the venue check (beach club / winery / distillery) and the bar-before-food priority were fixed only in DetailClient, so beach-club lists kept showing the old "Food Pics:" label on the overview page. Fixed 2026-06-04; the Food Pics label itself was retired 2026-06-05 (everything is `Pics:` now); keep the two functions in sync.

### Dish-specific Google Image search (`picsTerm`)

When a list title names a **specific menu item** (Best **Burgers**, Best **Pizza**, Best **Pasta**, Best **Tacos**, Best **Wings**, Best **Bagels**, Best **Ramen**, Best **Sushi**, etc.), the Google Image "pics" link should search for that **dish at that place**, not just the venue, so the photos show the food. Set a `picsTerm` field on the list to the **singular** item word (strip the plural: `Burgers` -> `'burger'`, `Tacos` -> `'taco'`, `Bagels` -> `'bagel'`; keep naturally-plural dishes like `'wings'`). `buildAuxLinks` appends `picsTerm` to the Google Image query, so e.g. `Bred Gourmet (Dorchester)` on the Boston burgers list searches `Bred Gourmet Dorchester Boston burger` instead of `Bred Gourmet Dorchester Boston`. Omit `picsTerm` on lists whose title is a place type rather than a dish (Best Dive Bars, Best Steakhouses, Best Hotels) and on non-location lists. This is universal: every new menu-item list must set `picsTerm`.

### How to gather the official Website for each item (the no-guessing method)

Apply this to every location list. The key is the same as everywhere else (exact item-name string, parenthetical and all); the value is the establishment's own site.

- **Gather live, never from memory.** Search the web for each item by name plus its neighborhood/city (e.g. `"Buff's Pub Newton MA"`). Take the result that is clearly the establishment's **own** domain.
- **Accept only the genuine official site.** A restaurant-platform builder subdomain counts as official (e.g. `*.goto-restaurants.com`, `*.hey-restaurants.com`, a brand's own `restaurants.<brand>.com`), as does the host venue's page when the spot lives inside it (a hotel/brewery/food-hall site for a bar or counter within it).
- **Reject aggregators and non-official hosts** and keep going: Yelp, TripAdvisor, OpenTable/Resy/Tock/Tablecheck/Toast/Clover-online and other reservation/ordering platforms, DoorDash/UberEats/Grubhub/Deliveroo and delivery apps, menu hosts (`*.res-menu.net`, `menuwithpricesonline`, `zmenu`, `allmenus`, etc.), review/guide/blog/news sites, ticket sites, tourism boards, and directory pages. None of these go in `itemLinks`.
- **Never guess a URL.** If the search surfaces only aggregators/news/blogs and no genuine official site, **omit that item** from `itemLinks` (the hover menu just shows Map + pics for it). It is correct and expected that some items have no entry. Do not invent or pattern-guess a domain.
- **Coverage.** Cover the union of all item names across every source and `vote.items`, minus the omitted ones. A list with most items linked and a few omitted is the normal, finished state.
- **Re-gathering only touches `itemLinks`,** never the item names, `links`, or vote keys.

### Yelp and TripAdvisor "pics" chips link to the real business page (`itemYelp` / `itemTripadvisor`)
- The hover menu's Yelp and TripAdvisor chips must link to the **actual business page**, never a Yelp/TripAdvisor search. Store the real page URL per item in an `itemYelp` object (food/bar lists) and/or an `itemTripadvisor` object (hotel/place lists), keyed by the exact item-name string, gathered live through the connected Chrome browser. Never guess a URL.
- **If an item has no Yelp (or TripAdvisor) page, omit it from that map.** The chip is then dropped for that item and only **Google** shows. It is correct and expected that some items have no Yelp/TripAdvisor entry, so some items show only Google.
- **Google stays a Google Image search** (built from the item name + neighborhood) and is always shown. Only Yelp and TripAdvisor require a stored real URL.
- Implemented in `buildAuxLinks` in `app/list/[id]/DetailClient.jsx`: `itemYelp`/`itemTripadvisor` supply the chip URL, and a falsy value filters that chip out of the row. Re-gathering only touches `itemYelp`/`itemTripadvisor`, never names/links/vote keys.

### Regional-app substitution for the Yelp chip (`itemYelpLabel`)

Where Yelp has no real coverage (see the regional platform map above), do NOT ship a sparse or empty `itemYelp` block. Substitute the region's relevant platform and treat it exactly like Yelp:

- **Store the regional platform's business-page URLs in `itemYelp`** (same field, same exact-item-name keys, same live-gathering and no-guessing rules: real business page, never a search URL; omit items the platform has no page for; use the flagship/current listing when duplicates or 移転 "moved" pages exist).
- **Set `itemYelpLabel` on the list** to the platform name so the hover-menu chip renders with it, e.g. `itemYelpLabel: 'Tabelog'`. Implemented in `entryPicsConfig` (`DetailClient.jsx`) and `picsConfig` (`ListOverview.jsx`) as `list.itemYelpLabel || 'Yelp'` — both mirrors must stay in sync as usual.
- **Which app:** the same regional platform map used for rating sources. Japan → Tabelog; Hong Kong / Macau → OpenRice; South Korea → Naver Place; Thailand → LINE MAN Wongnai; India → Zomato; Western Europe restaurants → TheFork where coverage exists; elsewhere fall back to TripAdvisor (use `itemTripadvisor`, which already has its own chip) or omit. Mainland China (Dianping) remains ungatherable, so omit there.
- **One platform per list.** If a list's geography spans several platform regions (e.g. a worldwide list), keep plain Yelp where it exists and omit elsewhere rather than mixing platforms under one label.
- Everything else about the chip is unchanged: a missing per-item URL just drops the chip and Google remains.

### Mandatory build checklist for a NEW location list (do NOT skip any)
A location list (restaurants, bars, breweries, bagels/bakeries, cafes, hotels, venues) is NOT finished until it has ALL of these, gathered live:
1. `links` — the sanitized Google Maps URL per item (required for `mapsCity`).
2. `itemLinks` — each item's **official website**. This is MANDATORY, not optional: a missing `itemLinks` means the hover menu shows no Website chip. (This was wrongly omitted on the first Asheville-breweries and bagels-nyc builds — do not repeat.) Omit only an individual item that has no genuine official site.
3. `itemYelp` (food/bar) and/or `itemTripadvisor` (hotel/place) — real business-page URLs.
4. At least one **editorial/expert source** in addition to the Yelp/Google rating sources (see the source rule above).
5. **Confirm every business is currently open (not permanently closed) before including it.** Do a quick live check for each item BEFORE adding it — watch for a "Permanently closed" flag on Google/Yelp/Tripadvisor or a closure announcement — and never include a closed place. If a check reveals a closure, drop it everywhere it appears (`ai` seed, every source's `items`, `vote.items`, `links`, `itemLinks`, `itemYelp`/`itemTripadvisor`) and backfill the `ai` seed and `vote.items` to 10 with an open, on-tier replacement (see "Drop permanently-closed locations" above). This applies when enriching or re-touching an existing list too, not just new builds.
6. **Descriptions for the full consensus top 10 AND hero images for the top 3** (see "Overview page
   research" section above). This applies to ALL new lists, not just location lists; for product lists
   include the Amazon "Customers say" consensus in each description.
Gather each website by searching `"<name> official website"` in the connected browser and taking the first genuine own-domain result; reject Yelp/TripAdvisor/menu-hosts/`*.restaurants-info.com`/delivery apps.

### Getting Yelp / TripAdvisor business-page URLs without hitting their bot walls
TripAdvisor (and sometimes Yelp) search pages are JS/bot-protected and return nothing when loaded directly. **Do not scrape them directly.** Instead, run a normal **Google search in the connected Chrome** for `"<venue> tripadvisor"` (or `"<venue> yelp"`) and read the `tripadvisor.com/...` (or `yelp.com/biz/...`) link straight out of the Google results — it's easy to confirm it's the property/venue page. Store that real URL in `itemTripadvisor` / `itemYelp`. If even the Google result has no real property page, omit that item (the chip drops and only Google shows).

### Source labels hyperlink whenever the source carries a `url`
- On the list page, the selected-source "Showing:" label and the source buttons link out to the source `url` whenever one is present, regardless of group: editorial publications, True Experts, Reviews & Ratings Aggregations (Yelp/Google/TripAdvisor/Amazon/Goodreads/readers' polls/critic aggregators), and pricing sources all link.
- The exceptions that do NOT hyperlink: the internal `composite` ranking (no URL) and the live fan vote (`cgvote`, no URL). If a source genuinely has no useful URL, leave `url` off the source object and it will render as plain text.
- Loosened 2026-06-09 (previously only `publication` / `trueexpert` groups linked) so readers can click through to the underlying ranking, rating page, or live search from any source.
- Gated by `isPublicationLink` in `DetailClient`, which now permits `publication` / `trueexpert` / `platform` / `pricing` to link when a URL is present.

## Common Mistakes to Avoid

- **Do not** put a food-first restaurant on a cocktail bar list. Cocktail bars that serve food are fine; full restaurants with a bar are not. **To fix:** audit every cocktail bar list and remove food-first restaurants.

- **Do not** forget `picsTerm` on a menu-item list (Best Burgers/Pizza/Tacos/Wings/Bagels...). Without it the Google Image pics show the storefront, not the dish. Set it to the singular item word. **To fix:** audit all existing menu-item lists and backfill `picsTerm` where missing.

- **Do not** use `booking` as a linkType — it is not used. All places use `mapsCity`.
- **Do not** treat the `ai` seed source as a real source — it is excluded from Borda by design.
- **Do not** use `mode: 'facts'` on a list that should have voting.
- **Do not** include off-tier items in any source — one bad source contaminates the entire consensus.
- **Do not** include non-five-star properties on a hotel or resort list unless the destination genuinely has no five-star options.
- **Do not** use absolute nightly rate for cross-region pricing comparisons — normalize against the local luxury floor when regions have very different cost-of-living baselines.
- **Do not** invent source rankings — research real ones.
- **Do not** order a source by the order spots appear in the article when the publication ranks by score or number — order Infatuation and other rated guides by their **numeric score, descending**.
- **Do not** feed an alphabetical or unordered list in as if its order were a quality ranking — find a ranked version, drop it, or label it `(alphabetical)` in the source name.
- **Do not** reconstruct a paywalled or JavaScript-only source's list/order from memory or search snippets — get it elsewhere, drop it, or substitute a readable source.
- **Do not** use sources older than 2–3 years.
- **Do not** under-tag — apply every tag that reasonably fits.
- **Do not** omit `publishedDate`.
- **Do not** seed `vote.items` with items that would be off-tier for the list.
- **Do not** leave item names ambiguous when a parenthetical would help.
- **Do not** ship a `mapsCity` list without an explicit `links` object — the raw parenthetical name makes Google Maps open driving directions instead of a location pin.
- **Do not** build a Maps URL by pasting the raw item name. Strip `(` `)` `,` `;` `&` first and use `https://www.google.com/maps/search/?api=1&query=...`.
- **Do not** forget to encode an apostrophe as `%27` in a link URL — a literal `'` breaks the single-quoted JS string.

---

## Activity Ledger labels (owner rules, 2026-06-07)

In both activity ledgers (per-list `ActivityFeed.jsx` and universal `app/feed/`):

- A dated source-refresh group (sources whose `label_updated_at` was stamped after a re-research
  pass) renders with the badge **"Sources Revisited"** (never "Refreshed Research" or "Sources
  updated"). When a refresh lands in the same deploy as new source additions (timestamps within 1h,
  stamped by the same cron run), the two groups MERGE into one "Sources Revisited" card: added
  sources tagged "Added", re-encoded ones tagged "Re-encoded", all ranking movements on that one card.
  Same-deploy REMOVALS fold in too (struck-through label, tagged "Removed", counted in the header);
  only a standalone removal keeps its own "Source removed" card (per-list ledger only, the universal
  feed names removals solely via this fold-in). A standalone "Source removed" card ALSO absorbs the
  ranking changes the removal produced (same 26h-after attribution as a source addition), so the
  per-list ledger answers "what shifted because of this drop?" right on the card. Implemented in
  `app/list/[id]/ActivityFeed.jsx` by building `removedGroups` before the attribution loop and
  including them as eligible hosts for `cause === 'edit'` rows.
- A re-encoded source can carry an explanatory note via a `sourceRevisions` map on the list object
  in `lib/data.js` (`{ sourceId: 'Correction (Month YYYY): ...' }`), rendered under that source's
  chip on the revisited card in both ledgers. Write one whenever a refresh changes how a source
  scores (e.g. ranked -> unordered, rankedHead). No em dashes in note copy.
- Voting entries show each ballot's picks 1st/2nd/3rd top-down plus the ranking movements the votes
  produced. **Vote impacts are PERSISTED at vote time** by `/api/votes` (consensus_alerts rows,
  cause 'votes', resolved=true, computed via a before/after `getSources` diff) because the feeds'
  live replay recomputes against CURRENT sources and silently changes once a list is re-edited. The
  replay remains as a fallback for pre-persistence votes; `collapseMoves` in both feed renderers
  collapses per-pick rows and cron duplicates to one display row per item.
- The universal feed mirrors the per-list implementation; keep the two in sync.

## Post-deploy consensus-check trigger (owner-requested 2026-06-07)

The Activity Ledger's ranking-change entries come from `/api/cron/consensus-check`, which only
runs daily on its own. **After every push that changes any list's consensus (new sources,
re-seeds, item changes), trigger the cron manually once the Vercel deploy is live:** open
`https://sourceoftruths.com/api/cron/consensus-check` via Chrome (or web_fetch) and confirm
`{"ok":true,...}`. This writes the movement entries (X moved from #N to #M) into the ledger
immediately instead of leaving the feed stale until the next daily run. Skip it for pushes that
cannot move a consensus (descriptions, heroes, this file).

## Renaming list items (re-parentheticalizing, abbreviating a state, fixing a name) — propagate everywhere AND clean up the consensus tracker (added 2026-06-09)

An item's name string is a **key in many places, not just a display label**. Renaming one item
(e.g. `(Charlton, Massachusetts)` -> `(Charlton, MA)`, or a list title's `LA` -> `Los Angeles`)
means updating EVERY keyed occurrence and then rebaselining the consensus tracker. Miss one and you
get a blank overview tile, an orphaned vote, or a spurious "entered the top 10" card. First done at
scale on `best-breweries-world` (US state names -> two-letter postal codes) and `caesar-wraps-la`
(title `LA` -> `Los Angeles`) on 2026-06-09.

**1. Update every file where the name is a key (not just `lib/data.js`).** Within the list's
`lib/data.js` entry: the `ai` seed, EVERY source's `items`, `vote.items`, and the keys of `links`,
`itemLinks`, `itemYelp`, `itemTripadvisor`, and `prices`. Then the two sibling files keyed by item
name: `lib/descriptions.js` (the consensus top-10 keys) and `lib/hero-images.js` (the top-3 keys). A
global literal find/replace of the full old name string -> full new name string is safe and catches
all of these at once; the URL VALUES (the Maps `?query=`, the Yelp/TripAdvisor business-page URLs)
do NOT need editing, a search query containing the full state still resolves correctly. A rename
changes no positions, so the Borda order is identical, but the description/hero keys must still match
the new names: re-run `node --check` plus the consensus verification before deploy.

**2. Migrate fan votes (the vote key is `listId::lowercased-item-name`).** A rename orphans any
existing vote. After deploy, read `/api/bootstrap` through the connected Chrome (the JSON is too
large for web_fetch) and look for `<listId>::<old lowercased name>` entries that carry a score. For
each, re-post the score under the NEW name with `POST /api/votes {listId, itemName:<new name>,
delta}`. **`delta` is clamped to +/-3 per call**, so a score above 3 needs several posts. If the item
is instead a user-submitted `extra` (in the `extras` table), use the admin extras rename endpoint
(`POST /api/admin/extras/rename {listId, oldName, newName}`), which moves the extra AND its vote
atomically, do NOT also re-post that one through `/api/votes` or you double-count.

**3. Rebaseline the consensus tracker, then clear the rename-artifact alerts (do it in the SAME
session as the rename).** `/api/cron/consensus-check` tracks each list's top 10 by item NAME, so a
pure rename reads as the old names exiting and the new names entering. Two consequences:

- **Public activity feed: nothing shows, by design.** These ranking-change rows carry cause `edit`
  (the source fingerprint changed) with no source-addition card or vote session to attach to, and
  both ledgers (`app/feed/page.js` and `ActivityFeed.jsx`) intentionally DROP such orphan changes.
  So a rename never pollutes the public feed.
- **Admin Research tab: it fills with false `entered_top10`/`entered_top3` alerts** (one per renamed
  top-10 item, plus an extra row per renamed top-3 item) that must be cleared. Workflow: (a) run the
  cron ONCE to rebaseline the snapshot to the new names (`GET /api/cron/consensus-check`; a second
  run then reports `newAlerts:0`, confirming it won't re-fire); (b) `GET /api/consensus-alerts`,
  filter to the list, and confirm every artifact alert already shows `hasDescription:true` (and the
  top-3 ones `hasHeroImage:true`) because step 1 moved those keys; (c) resolve each by id with
  `POST /api/admin/alerts {id}`. Auth: the admin **cookie** is used automatically if the owner is
  logged into `/admin` in the connected Chrome (try this first), otherwise send the header
  `x-admin-token: <ADMIN_TASK_TOKEN>` (the token lives in `.deploy-secrets`). `web_fetch` is GET-only,
  so these POSTs run as `fetch()` calls from the sourceoftruths.com origin via the connected Chrome.
  (d) Re-GET `/api/consensus-alerts` and confirm 0 remain for the list.

If you skip step 3, the daily cron generates the same artifacts on its next run anyway (just without
the cleanup), so always rebaseline and resolve now. For a cosmetic rename there is no real movement,
so the regular "trigger the consensus-check after a consensus change" rule above reduces to exactly
this artifact cleanup, there are no genuine "X moved from #N to #M" entries to surface.

## Search engine indexing (set up 2026-06-05)

The site's indexing pipeline is mostly automatic; the per-deploy step is one IndexNow ping.

**Standing infrastructure (already in place):**
- `app/sitemap.js` — auto-generates `/sitemap.xml` from `LISTS`, with each list's real
  `publishedAt` as `lastModified` (never `new Date()` per build — fake churn makes Google
  distrust the dates). The homepage's `lastModified` is the newest list's timestamp.
- `app/robots.js` — serves `/robots.txt`: allow all, disallow `/admin` and `/api/`, points
  to the sitemap.
- **IndexNow key:** `598abff60a4ec1cbbe4ae6fc007be9a0`, served at
  `https://sourceoftruths.com/598abff60a4ec1cbbe4ae6fc007be9a0.txt` (file in `public/`).
  Covers Bing, DuckDuckGo, Yandex, Naver, Seznam. Google does not use IndexNow; it picks up
  new lists from the sitemap on its own.
- Google Search Console is verified (sitemap submitted); Bing Webmaster Tools imports from GSC.

**Per-deploy step — ping the consensus cron after every push that changes LIST DATA (sources,
items, votes-affecting edits):** the daily 09:00 UTC cron is the only thing that diffs consensus
and stamps ledger events, so an edit deployed at noon shows up in the activity ledgers dated the
NEXT morning (detection time), up to 24h after the fact — exactly how the June 5 twitter-accounts
rework surfaced as "Jun 6" cards. After Vercel finishes deploying a data change, hit
`https://sourceoftruths.com/api/cron/consensus-check` once via `web_fetch` (a plain GET; response
`{"ok":true,...}`). The run is idempotent, detects the change immediately, dates the ledger cards
to the actual deploy day, and attributes them correctly (cause `edit` via the source fingerprint).
Skip it for pushes that don't touch list data (descriptions, heroes, code, this file).

**Per-deploy step — ping IndexNow after every push that adds or substantially changes lists:**
after Vercel deploys (~1 min after push), send a GET via `web_fetch` (sandbox curl cannot
reach api.indexnow.org; web_fetch can):

```
https://api.indexnow.org/indexnow?url=https://sourceoftruths.com/list/<id>&key=598abff60a4ec1cbbe4ae6fc007be9a0
```

One ping per new/changed list URL (a 200/202 response = accepted). Skip the ping for pushes
that only touch internals (descriptions, itemYelp, this file). Don't ping URLs that aren't
live yet — wait for the Vercel deploy, and remember the Hobby-plan deploy limit (a push that
silently didn't deploy means the URL 404s; verify before pinging).

## Homepage Discover ordering: no two product lists adjacent

The Discover (default, seeded-shuffle) sort on the homepage must never place two
Products-bucket tiles (the 'shops' browse category: tags `product`/`tech`) directly
next to each other, whenever that is mathematically possible (products <= non-products + 1).
Implemented as `spaceOutProducts` in `app/HomeClient.jsx`: the shuffle is partitioned into
products and non-products, and each product is dropped into its own seeded-random gap
between non-products. When full separation is impossible, extras spread round-robin to
minimize adjacency. The other sorts (Trending/Popular/Recent) are NOT subject to this
rule. If the Discover pipeline is ever rewritten, preserve this constraint.

## Overview page research: descriptions, hero images, and consensus alerts

The list overview page (`ListOverview.jsx`) renders, for every list, the live consensus top 10 with a
1-2 sentence description per item and a hero photo for ranks 1-3. Three systems support this:

**HARD RULE for every NEW list: it must ship with descriptions for all 10 consensus top-10 items
(`lib/descriptions.js`) AND one hero photo per top-3 item in `lib/hero-images.js` as
`{ src: <remote https image URL>, credit, creditUrl }` (see "Hero images" below for the URL-gathering
pipeline) before deploy.** This applies to all list types, location and non-location alike. A new list
without its 10 descriptions and 3 credited hero photo URLs is unfinished. Never commit image files;
never ship generated placeholders.

**Product lists (`linkType: 'amazon'`): each item description = a short product description PLUS the
"Customers say" consensus.** Amazon product pages carry an AI-generated "Customers say" summary of
reviews. Read it live off the product page (connected Chrome) while gathering the ASIN/rating, then
condense it into the description's second sentence, e.g. "Buyers call it a beautiful story of courage
and survival and praise its historical accuracy." Do not invent the consensus; if a product has no
"Customers say" block, synthesize from the top reviews instead.

**HARD RULE — the bare star rating is NOT the "Customers say" consensus, and a facts-only description
is NOT acceptable on a product list (owner ruling, 2026-06-06).** Two specific failure modes are
banned, both discovered in a June 2026 audit that found 369 product descriptions across 61 lists
missing a real review synthesis (the LEGO list was the trigger):

1. **Never substitute the numeric rating for the synthesis.** "Buyers rate it 4.8 stars" is NOT a
   "Customers say" sentence, it is the star count gathered for the Amazon ratings *source*. The
   second sentence must convey what reviewers actually *said* about the product (qualities they
   praise, gripes they raise, how they use it), in qualitative language. A star number alone fails
   the rule. You may mention the rating in addition, but it can never be the whole reviewer sentence.
2. **Never ship a facts-only product description.** Every consensus top-10 item on a product list must
   carry a buyer-voice second sentence (Customers say, condensed top reviews, or for niche/no-listing
   items a grounded statement of how owners/collectors regard it). A pure spec sheet with no reviewer
   voice is incomplete.

**The "Customers say" block must be read live, per item, every time — it is a distinct page read from
the rating, not derivable from it.** The block lazy-loads: navigate to `/dp/<ASIN>`, scroll into the
reviews section (~30-40 wheel ticks, then a short wait), and scan the page text for "Customers say".
It is NOT shown on every listing (sparse third-party listings, some heavily-A+-skinned pages, and
listings with few reviews often lack it); when genuinely absent after a real scroll, synthesize the
second sentence from the visible "Top reviews from the United States" instead, and for an item with no
Amazon listing at all (linked to a Google search) ground the sentence in its real-world owner/collector
reputation without claiming an Amazon block. **Per-item verification before deploy:** scan each new
product list's consensus top-10 descriptions and confirm every one has a qualitative reviewer clause,
not just a number and not just specs.

**Consumable products (seltzer flavors, snacks, drinks, etc.): use the ingredient list / nutrition
facts to fill out the description when more content is needed.** For flavor or food/beverage product
lists where there isn't much editorial to say about an individual item, read the ingredient list and
nutrition facts off the product page (live, connected Chrome) and work the notable details into the
description, e.g. calories, sugar, sodium, real-juice vs natural-flavor sourcing, caffeine. This is
the preferred filler content over generic marketing copy.

### Descriptions for the consensus top 10
- `lib/descriptions.js` keys by list ID then exact item name. Every item in a list's **live consensus
  top 10** (not the `ai` seed) needs a description. Compute the consensus with the same scoring as the
  site (`getSources` + live votes from `/api/bootstrap`) before writing.
- Style: 1-2 sentences, specific and editorial, no em dashes. Amazon lists get a reviewer-consensus
  second sentence. Keys must be byte-for-byte identical to the item names in `lib/data.js` (straight
  ASCII apostrophes, exact parentheticals).
- Rollout is batched by traffic (view counts from `/api/bootstrap`); ~159 lists total.

**CRITICAL — always compute the Borda consensus BEFORE writing descriptions, not after.** The `ai` seed (`list.sources.ai.items`) is a manually curated placeholder that is EXCLUDED from Borda scoring. The actual consensus top 10 is driven by the ranked editorial sources and often differs from the seed. Writing descriptions for the seed items and not the real consensus items is the mistake that causes blank tiles on the overview page. The correct workflow:

1. Finish building all sources in `lib/data.js`.
2. Run the Borda computation (either mentally or with a quick node script) to identify the real consensus top 10.
3. Write descriptions for those 10 items — not for the seed, not for what seems like the "obvious" top 10.
4. Verify with a script: load `LISTS` + `DESCRIPTIONS`, call `computeConsensus(list)`, confirm every item in the result has a description key.

Example node check (run before every deploy of a new list):
```javascript
import { LISTS } from './lib/data.js';
import { DESCRIPTIONS } from './lib/descriptions.js';
// HARD RULE: the consensus check MUST mirror lib/helpers.js getSources EXACTLY,
// the single source of truth for scoring. Before every new-list verification,
// re-read getSources and copy its current logic (today: absent items earn 0
// from a source, NO average credit; unordered flat scoring; top-10 Borda).
// Do NOT paste computeConsensus from scripts/generate-og-images.js or any other
// mirror without first diffing it against helpers.js; a drifted mirror once
// predicted the wrong #10 item, the description was written for the wrong
// island, and the live overview tile shipped blank.
const top10 = computeConsensus(LISTS.find(l => l.id === 'your-list-id'));
const missing = top10.filter(item => !(DESCRIPTIONS['your-list-id'] || {})[item]);
if (missing.length) throw new Error('Missing descriptions: ' + missing.join(', '));
```

### Hero images for the consensus top 3 (one picture per item, by URL)
- `lib/hero-images.js` maps list ID -> item name -> `{ src, credit, creditUrl }`. `src` is a **remote
  https image URL**; the site's built-in image optimizer (next/image, `remotePatterns` in
  `next.config.js`) fetches, resizes, WebP-converts, and CDN-caches it at request time. **No image
  bytes are ever stored in the repo or pass through Claude** (the Cowork sandbox cannot download
  images; that constraint drove this design — do not attempt byte-level acquisition).
- `credit` is REQUIRED: the photo's source (venue / publication / photographer), rendered as a small
  overlay caption linking to `creditUrl`. Legacy plain-string local paths still render but carry no
  credit; replace them as lists are touched.
- **Dish lists get dish photos** (burgers, wings, tacos, pizza, breakfast sandwiches...): the photo
  must show the dish at that spot, never the storefront — same logic as `picsTerm`. Venue-type lists
  (hotels, bars, breweries) use the venue/property shot.
- **Gathering URLs (fast, via connected Chrome):** Google Images search `"<item> <locality> <dish>"`,
  click the best candidate to open the preview, then run JS to surface the full-res source URL via the
  tab title (long URLs in JS results get blocked by the output filter; `document.title='IMG::'+img.src`
  and reading the tab context is the reliable route):
  `const imgs=[...document.querySelectorAll('img')].filter(i=>i.naturalWidth>400 && !/google\.com|gstatic/.test(i.src)).sort((a,b)=>b.naturalWidth*b.naturalHeight-a.naturalWidth*a.naturalHeight); if(imgs[0]){document.title='IMG::'+imgs[0].src.slice(0,250);}`
- Source preference: venue's own site/gallery (credit venue + photographer if named) > editorial
  (Eater, The Infatuation, Time Out...; credit the publication) > platform photos. Prefer stable CDN
  hosts. If a URL dies later, the tile silently falls back to the PhotoBox placeholder.
- If the displayed photo looks wrong/low-res after deploy, swap the URL — never ship a generated
  placeholder image as if it were a photo.
- **MANDATORY aesthetic review — LOOK at every hero photo before shipping it.** Open each candidate
  full-size in the connected Chrome and visually judge it as a magazine cover editor would. The
  standard is "postcard-grade": dramatic light or color, a clearly recognizable iconic subject,
  clean composition. REJECT: drab/grey weather, a half-frame of dirt or scrub, blank stone walls or
  ruins with no charm, cluttered snapshots, tilted horizons, watermarked stock previews, anything
  that reads "tourist phone photo." Convenience is not a criterion — never take the first
  acceptable API/search result without seeing it rendered (a Commons result can be technically
  fine and visually dull; that mistake shipped a drab rock-wall photo as the Paros hero once).
  Landscape orientation strongly preferred for the overview tiles. If the first search yields
  nothing beautiful, change the query (add "aerial", "sunset", "panorama", the iconic landmark
  name) and keep looking — for famous subjects a stunning shot always exists.
- **Hero photos must work on BOTH desktop and mobile, or use the `contain` fallback (owner rule,
  2026-06-06).** The overview tile renders at very different shapes by viewport: on desktop the photo
  sits in a narrow near-square column, but on mobile the grid collapses to one column and the photo
  becomes a wide, short band. A portrait image cropped with the default `objectFit: cover` loses its
  subject (head and feet) in that wide mobile band. So when choosing each top-3 hero, FIRST find a
  genuinely landscape, subject-centered photo that survives a center-crop at both shapes: that is the
  default and stays full-bleed with no letterboxing (apply the magazine-grade aesthetic review above).
  ONLY if no good landscape photo exists for the subject (portrait headshots of people, tall book
  covers or posters, vertical artwork), do NOT ship a cover-cropped portrait. Instead set
  `heroFit: 'contain'` on the list object, which applies the same crop-free contain plus cream-padding
  treatment used for product lists, so the full image shows at every viewport. Implemented in
  `app/list/[id]/ListOverview.jsx` as `containHero = isProduct || list.heroFit === 'contain'` (HeroTile
  passes `fit`/`bg`/`pad`; the poster variant reuses HeroTile so it inherits the behavior). First used
  on `best-basketball-player-all-time` (portrait player photos). Decide per list, and prefer genuine
  landscape photography whenever it exists.
- **Contain-fit hero pads AUTO-MATCH the image background (rule, 2026-06-10) — no manual `bg` needed.**
  A `contain` hero (every product list, and any `heroFit:'contain'` list) renders the photo uncropped,
  leaving a gutter. That gutter is NO LONGER a fixed cream/paper fill: `lib/useSampledBg.js` loads the
  image through the same-origin `/_next/image` optimizer (so the canvas read is untainted), samples the
  median of its border pixels, and sets the pad to that color, so a white product shot pads white and a
  tinted one (the light-blue bidet) pads that blue. It falls back to WHITE until the sample resolves and
  for transparent-corner PNGs. Wired into BOTH render paths (the two that must always stay in sync):
  `useSampledBg` in the homepage tile (`app/HomeClient.jsx`, the `heroBg` const) and in `HeroPhoto`
  (`app/list/[id]/ListOverview.jsx`, the `padBg` const, covering the normal tile AND the share-poster
  capture). Cover-fit (cropped) heroes are unaffected. So when gathering a product/contain hero you do
  not set a background color by hand; the pad is derived from the photo itself.
- **Attribution check for photos from multi-venue roundup articles — verify the photo shows THIS
  place's dish.** A roundup article ("Best Wings in NYC" etc.) carries one lead/hero image that
  belongs to a SINGLE venue in the article, usually named only in its caption or credit, plus one
  photo per venue section. Never take the article's lead image (or any image whose placement is
  ambiguous) for an item without confirming the caption/credit/filename names that item; pull the
  image from inside the item's own section of the article, and sanity-check the dish itself (a
  Buffalo-wings-with-blue-cheese shot cannot be Madame Vo's fish-sauce wings). This exact mistake
  shipped Dan and John's Buffalo wings as the Madame Vo hero on `best-wings-nyc` (caught and fixed
  2026-06-05): the Eater lead image was captioned "Dan and John's wings" but was filed under
  Madame Vo. When attribution cannot be confirmed, find a different photo (venue site, Yelp
  business gallery) rather than guessing.
- **Never trust a CDN filename as proof the image shows the correct venue.** Editorial CMS systems
  routinely mislabel uploaded files. A URL containing `RedHookTavern_Burger.jpg` does not guarantee
  the photo actually shows Red Hook Tavern's food — the file could be misnamed in the CMS. Always
  visually verify the image looks like the venue's known food and style (compare against their own
  website, Instagram, or Yelp photos), and prefer sourcing from the venue's own site when a good
  photo exists there. This caught the `burgers-nyc` Red Hook Tavern hero (2026-06-08): the Eater
  CDN filename said "RedHookTavern" but the image showed a different restaurant's thick patty burger,
  not Red Hook Tavern's signature smash burger.
- **Stable-host check for hotlinked URLs:** prefer images.pexels.com / editorial CDNs /
  upload.wikimedia.org / venue sites; avoid expiring signed URLs (fbcdn, Instagram CDN,
  googleusercontent thumbnails) — they die and blank the tile.
- **BANNED HERO HOSTS: googleusercontent.com and the Meta CDNs are not photo sources (owner rule,
  2026-08-21).** This upgrades the soft "avoid expiring signed URLs" advice directly above into a hard
  ban, because the soft version did not hold. A 2026-08-21 audit of all 2,566 hero entries found **101
  blank hero tiles across 55 lists**, and every single one was an `lh3.googleusercontent.com` Google
  Maps place photo. They were gathered live, verified at the time, and later died as a group: as of the
  audit they fail BOTH raw in the browser AND through `/_next/image` (502), so the podium photo and the
  home tile blank together. Nothing surfaced it, because a dead hero renders as an empty frame, not an
  error. Never use, on a list hero or a quiz hero:
  `*.googleusercontent.com` (incl. `lh3`, the `/gps-cs-s/` and `/grass-cs/` Maps paths), `*.ggpht.com`,
  `*.fbcdn.net`, `*.cdninstagram.com`, `lookaside.fbsbx.com`. The tell is a URL with a long opaque
  token and no filename: that is a rotating handle, not an address.
- **Yelp business photos are the reliable fallback for a venue with no good press photo, but you MUST
  prove the photo belongs to that business.** A `yelp.com/biz/<slug>` page also carries photos from
  OTHER businesses (the "people also viewed" block), and scraping `bphoto` ids off the page picks them
  up indistinguishably. This is the same class of error as the Madame Vo / Red Hook Tavern
  mis-attributions above, and it nearly shipped twice on 2026-08-21 (a sandwich photo surfaced under
  BOTH Providencia and La Palma Mexicatessen). **The ownership check:** fetch
  `yelp.com/biz_photos/<slug>?select=<photoId>` and require **200**; a photo belonging to another
  business returns **404**. Run it on every candidate before shipping it, then use
  `https://s3-media0.fl.yelpcdn.com/bphoto/<id>/o.jpg` (the `/o.jpg` original) with
  `credit: "Yelp"` and `creditUrl` set to the business page. Gather the slug from the list's own
  `itemYelp` map rather than guessing it.
- **`node scripts/verify-heroes.mjs` is the gate, and it must be green before any hero change ships.**
  It checks both `lib/hero-images.js` and `lib/quiz-heroes.js` for: banned hosts, missing consensus
  top-3 coverage, WebP/AVIF and format-negotiating CDNs, non-free Wikimedia `/thumb/` upscales, heroes
  with no credit, orphan blocks, and the quiz registry rules (every heroed id real, QOTD pool and
  overrides heroed, the NEWEST quiz heroed). `--live` additionally loads every remote hero through the
  live optimizer. It is discovered automatically by `scripts/verify-all.mjs`.
  **`scripts/hero-baseline.json` grandfathers the 100 defects that already existed on 2026-08-21** so
  the gate ships GREEN and goes RED only on a NEW one, per the verify-listed lesson that a checker
  which ships red is ignored within a week. That file is a **burn-down list, not a permission slip**:
  fix heroes and re-run `--baseline` to shrink it. **It must never grow.** An entry appearing in a diff
  means someone regenerated the baseline to silence a real defect, which is the one way to make this
  whole mechanism worthless.
- **Format check: hero URLs MUST resolve to JPEG or PNG, never WebP or AVIF (owner rule, 2026-06-10).**
  Satori's Edge ImageResponse decoder cannot reliably handle WebP/AVIF (browsers can; Vercel Edge
  cannot). The `app/list/[id]/poster-image/route.js` poster route hardening committed 2026-06-10
  (commits 6d4546b + c2df264) pre-validates each top-3 hero URL with `Accept: image/jpeg,image/png`
  and rejects any `image/webp` or `image/avif` response — so a WebP-serving hero silently becomes
  a solid-red fallback panel on the IG poster (which fails the three-photo gate and blocks IG
  posting for that list). When gathering a hero URL, REJECT:
  (a) any URL ending in `.webp` or `.avif` (literal upload), and
  (b) any image CDN that auto-negotiates WebP/AVIF based on the request's Accept header.
  Confirmed WebP-negotiating CDNs (do not use): Cloudinary `f_auto` transforms (e.g.
  `img.belmond.com/f_auto/...`), `assets.kerzner.com/api/public/content/...` (One&Only / Atlantis /
  Mazagan group), `images.axios.com`, `holidayexpert.com` uploads. When the venue's own site uses
  one of these CDNs, find the photo elsewhere (the venue's gallery sometimes has a direct `.jpg`;
  Wikimedia Commons; Pexels; editorial outlets like Eater/Time Out/CN Traveler that host stable
  JPGs). Outstanding follow-up (2026-06-10): swap the WebP-served hero URLs on cape-town#3
  (One&Only kerzner.com), amsterdam#1 (Café de Dokter holidayexpert .webp), and nashville#3
  (Coral Club axios.com) in `lib/hero-images.js`. Until swapped, those three lists post with a
  red fallback at one of their top-3 positions and should NOT be picked for IG posting.
- **Wikimedia hero URLs: link the ORIGINAL file, never a `/thumb/.../Npx-` upscale (owner rule, 2026-06-10).**
  `upload.wikimedia.org` generates `/thumb/<a>/<ab>/<File>/<N>px-<File>` thumbnails on demand but
  REFUSES to upscale: if `N` is wider than the source file, the thumbnailer 404s, next/image then
  gets a non-image upstream, and the overview tile renders BLANK. This bites album/cover lists
  specifically and recurs every time: non-free English-Wikipedia cover art (`/wikipedia/en/...`) is
  deliberately low-resolution (Thriller and The Bodyguard are exactly 300×300), so a `800px-` thumb
  is always an upscale that 404s. Re-applying the same `800px-` pattern on each "fix" is why
  `best-selling-albums-all-time` kept going blank. THE FIX: for any Wikimedia album/cover hero, drop
  the `/thumb/` segment and the trailing `/<N>px-<File>` and point `src` straight at the original
  file, e.g. `https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png`. The
  original always exists (the thumb derives from it) and next/image downscales it to the tile. Square
  300px covers are fine at tile size ("album squares are fine"). This applies to the few commons
  covers too (Back in Black, Zeppelin IV). A `/thumb/.../Npx-` URL is ONLY safe for genuinely large
  Commons PHOTOS whose source exceeds `N` (the hotel/destination heroes at `1280px-` are fine, their
  sources are multi-thousand-px) — never for low-res non-free cover art. Verify a new Wikimedia hero
  resolves through the live optimizer (`/_next/image?url=...`) before shipping. Done 2026-06-10:
  converted all 25 cover URLs in the albums + soundtracks blocks of `lib/hero-images.js` to originals.
- **Hash-verify every repo read used for a splice.** The bash mount has silently dropped
  characters from `git show` output more than once (a `\u2013` lost a digit and broke
  `node --check`). Before splicing into or pushing any file, confirm
  `git hash-object <copy>` equals `git rev-parse <commit>:<path>`; re-read until it matches.
- **Re-check the LIVE consensus top 3 immediately before and after shipping a hero wave.**
  Fan votes move small-margin lists within hours: a herocheck computed from a morning
  bootstrap snapshot shipped a wave that was already stale by deploy time (The Sopranos had
  entered the best-hbo-shows top 3 and its tile rendered the placeholder). Re-ferry
  `/api/bootstrap` right before finalizing the wave, and after deploy open each shipped
  list's overview page and confirm all three tiles carry a credit caption — a
  "curating a fancy photo" placeholder on a just-shipped list means consensus drifted.
- **Reject AI-generated images on sight.** Image search now surfaces them (a
  `Gemini_Generated_Image_*` file was the TOP Bing result for a Sagaponack beach query,
  hosted on a real magazine's CDN). A generated picture is never a photo of the place;
  check filenames and look for telltale rendering before accepting any search result.
- **Multi-venue brands: confirm the location in the filename/page before accepting.** Ski,
  hotel, and restaurant brands with several sites (La Folie Douce, Aman, McDonald's) surface
  photos of the WRONG location at the top of image search; the Val Thorens terrace nearly
  shipped as the Val d'Isère hero. The same attribution rule as dish photos applies: the
  file name, page caption, or host page must name the specific location.

### Consensus change alerts (research queue)
- Tables `consensus_snapshots` + `consensus_alerts` (migration `08_consensus_alerts.sql`).
- **Activity-ledger attribution:** both ledgers (per-list `ActivityFeed.jsx` and universal
  `app/feed/page.js` + `FeedClient.jsx`) pair each ranking change with its cause: a change detected
  within ~26h after a post-launch source addition merges into that source-add card (dual chips
  "Source added" + "Ranking change"); an unattributed change renders with "Votes" + "Ranking change"
  chips. "Launch batch" sources = first seen within **6h** of the list's publish time; this window
  lives in BOTH ActivityFeed.jsx and app/feed/page.js and the two must stay in sync. Sources added
  before the stamping feature shipped (2026-06-07) were launch-anchored by its first run; the real
  add dates for the affected lists were restored by migration 14.
- `/api/cron/consensus-check` runs daily via Vercel cron (`vercel.json`): recomputes every list's
  consensus top 10, diffs against the snapshot, and inserts an alert when an item newly enters the
  top 10 (`entered_top10`, needs a description) or top 3 (`entered_top3`, needs a hero photo).
  The same diff also records exits (`exited_top10`, `exited_top3`) and within-top10 shifts
  (`moved`), inserted with `resolved=true` so they show in the public activity ledgers but never
  enter the research queue (no description or hero work needed). Every alert row stores the exact
  movement as `prev_rank` -> `rank`, where **0 means unranked** (outside the top 10); the ledgers
  render "moved from #X to #Y / unranked" and never show a rank beyond 10 (owner rule, 2026-06-07).
  Rows with `prev_rank` null are legacy (pre-movement-tracking) and render the old boundary
  phrasing. An unranked item entering the top 3 fires entered_top10 AND entered_top3 (two research
  rows); both feeds dedupe the display. Each alert also carries a `cause`: the cron fingerprints
  every list's source data (`sourcesFingerprint`) and stores it on the snapshot; if the fingerprint
  changed since the last run the change is attributed to a deploy edit (cause `edit`, "List edited"
  chip), otherwise to fan votes (cause `votes`, "Votes" chip) -- BUT 'votes' is never attributed to
  a list with zero recorded votes (no `votes`/`vote_events` rows): a voteless list's change can only
  come from a deploy, so it gets cause `edit` (owner rule 2026-06-07, after the meyhanes-rename
  changes displayed as "Voting" on a list nobody had voted on). The fingerprint also folds in
  `SCORING_ENGINE_VERSION` (exported from `lib/helpers.js`): **bump that constant in the same push
  whenever the scoring engine's behavior changes** (getSources math, padding, weighting, tie-breaks,
  in helpers.js or any mirror), so engine-deploy consensus shifts attribute as `edit`, not votes.
  Null cause = legacy row (pre-migration-16); both ledgers render it with a neutral "Ranking change"
  chip only -- never a Votes chip (migration `19_reattribute_voteless_alerts.sql` re-attributed
  legacy null/votes rows on voteless lists to `edit`). Migrations
  `14_restamp_source_dates_and_exits.sql`, `15_alert_rank_movement.sql`, and
  `16_alert_cause.sql` cover the schema.
  First run seeds snapshots silently. Optional `CRON_SECRET` env var protects the route.
- The admin panel (`/admin`) has a **Research** tab listing unresolved alerts with what each needs;
  resolve via `/api/admin/alerts` once the research ships.
- `/api/consensus-alerts` is a public read-only feed of unresolved alerts (used by the weekly
  email summary task in Cowork; supports `?sinceDays=7`).
- When researching an alert: write the description into `lib/descriptions.js`, add the hero image if
  top 3, deploy, then resolve the alert in the admin panel.

## Full Example List Entry

```javascript
{
  id: 'cocktails-west-village',
  publishedDate: '2026-05-27',
  title: 'Best Cocktail Bars in the West Village',
  category: 'New York',
  type: 'food',
  tags: ['bars', 'nightlife', 'food-drink', 'stores', 'entertainment'],
  linkType: 'mapsCity',
  blurb: 'Intimate rooms, serious bartenders, and menus that reward attention. The West Village does cocktails better than almost anywhere.',
  defaultSource: 'ai',
  sources: {
    ai: {
      label: 'Consensus Seed',
      items: [
        'Dante NYC',
        'Employees Only',
        'The Nines',
        'Slowly Shirley',
        'Bar Pisellino',
        'Little Branch',
        'Amor y Amargo',
        'Clover Club (Brooklyn)',
        'The Up & Up',
        'Attaboy',
      ],
    },
    infatuation: {
      label: 'The Infatuation NYC 2024',
      items: [
        'Dante NYC',
        'Employees Only',
        'Bar Pisellino',
        'Little Branch',
        'Amor y Amargo',
        'The Nines',
        'Slowly Shirley',
      ],
    },
    timeout: {
      label: 'Time Out New York 2024',
      items: [
        'Employees Only',
        'Dante NYC',
        'Little Branch',
        'Slowly Shirley',
        'The Up & Up',
        'Amor y Amargo',
        'Bar Pisellino',
        'The Nines',
      ],
    },
    eater: {
      lab


```
_(The example above was truncated in an earlier edit; see any live list in lib/data.js for the full shape.)_

## THE LIST PAGES DID NOT SERVER-RENDER, and the gate was one word (2026-09-20)

`app/list/[id]/DetailClient.jsx` gated its whole render on `!loaded`, and `loaded` only
flips after a client-side `fetchBootstrap()`. So the server HTML for all 586 list pages was
a spinner reading "Loading the ranking...", with **no H1, no title, no blurb and no
ranking**, and Google saw only that plus the `ListSeoSection` at the foot. Measured on the
live site: 97 list pages took 8,539 impressions and converted at **0.36%**.

The gate is `!list` now. `list` comes from the statically imported `LISTS`, so it resolves
during the server render, and bootstrap only enriches (votes, views, extras). Three reasons
it is safe, and they are the things to re-check if this is ever touched:

- **Every browser access in that file is already inside an effect** behind a
  `typeof window === 'undefined'` guard (`loadUserVotes`, `hasUserVoted`,
  `getUserVoteForList`, the hash deep-link effect). `RankingView.jsx` has none at all, and
  `lib/useSampledBg.js` reads its canvas in an effect.
- **Hydration matches** because the first client render starts from the same empty
  `voteData` / `extras` / `viewCount` the server used, and nothing in the render path is
  nondeterministic. `initialSourceId` derives from `sources`, which derives from `list`.
- **`!list` is strictly better than `!loaded`**, not just earlier: a user list that only
  exists in the bootstrap payload still shows the spinner until it arrives.

The homepage had no `<h1>` either (13 `<h2>`s, no `<h1>`); the About heading in
`QuizHomeClient` is now the `<h1>`, same class and same text, so nothing moved on the page.

### The homepage h1 is StageToday's slate heading, and the About prose is ORPHANED (2026-09-20)

`QuizHomeClient` early-returns `<StageToday />` when `stageHome` is true, which is the
default on `/`. Everything below that return, including the "About Mind Loft" section whose
own comment says it exists so Google stops picking /terms as the page this site is about,
**has not rendered on the live homepage since the stage home became the default**. Verified
on production: the string does not appear in the homepage HTML except as a footer link.

So the homepage's `<h1>` is `<h1 className="sty-slate">` in `app/today/StageToday.jsx`, the
first server-rendered heading on the page. Same class and text as the `<h2>` it replaced, so
nothing moved. **If the About prose is wanted back, it has to move into StageToday**; editing
it where it currently sits changes nothing a reader or a crawler will ever see.

Also: `app/page.js` carries its own `generateMetadata`, and a page-level `openGraph` REPLACES
the layout's rather than merging, so `/` shipped with no `og:image` until the card was named
in both places. Check the rendered `og:image`, not the layout, after any metadata change.
- **The group page's join bar says what the group IS, not how you got there**
  (owner report, 2026-09-21: "why does the top of the group page say i was
  invited? i dont think i was"). "You're invited by X" was written when a link or
  a code was the only way to reach a group page; public groups are browsable from
  /groups now. Public reads "Open group. Anyone can join.", private reads "Invite
  only. Anyone with this link can join."
- **The finish card leads with the GAME when the group played it** (owner,
  2026-09-21). `FinishGroupLine` now takes `gameName` and `missLabel`: when
  another member has a row on that game (`boards[gameKey]` from the standing
  read), the card shows "You're 2nd of 3 on Sando" with each member's run in the
  game's own units, and today's overall group standing drops to one line under
  it with the movement arrow. Nobody else has played it, and the card is exactly
  the day board it was.
