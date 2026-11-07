# Fork app/jig/JigClient.jsx into app/saw/SawClient.jsx.
#
#   python3 scripts/fork-saw-client.py
#
# Saw plays EXACTLY like Jig (owner, 2026-11-07): the loose table on a computer,
# snapping into place on a phone; only the photo is portrait and the cut taller
# than wide (scripts/gen-saw.mjs). So Saw's client is generated from Jig's:
# change Jig, re-run this, and both stay in step. Every replacement must match
# exactly as many times as listed or the script stops.
import re, sys

s = open('app/jig/JigClient.jsx').read()

def R(a, b, n=1):
    global s
    c = s.count(a)
    if c != n:
        sys.exit(f'fork-saw-client: expected {n} of {a[:70]!r}, found {c}')
    s = s.replace(a, b)

# the header
a = s.index('// Jig, the daily jigsaw.'); b = s.index('import React')
s = s[:a] + """// Saw, the tall daily jigsaw: Jig's sibling. GENERATED from app/jig/JigClient.jsx
// by scripts/fork-saw-client.py; do not hand edit, change Jig and re-run.
//
// Saw plays exactly like Jig (owner, 2026-11-07): the loose table on a
// computer, pieces snapping into place on a phone (the play box), the same tray,
// Peek, hint and scoring. Only the picture differs: a PORTRAIT Wikimedia Commons featured
// photo a day, cut 8x10 or 7x11 (scripts/gen-saw.mjs), so the pieces are larger
// on a phone. Its photos are re-used later by Swap, Slide and Spin
// (scripts/gen-photo-trio.mjs).

""" + s[b:]

# no shelf and no renumbering for Saw
R("import ShelfLink from './ShelfLink';\n", '')
R("import { migrateJigSaves } from '@/lib/jig-renum';\n", '')
a = s.index('migrateJigSaves();'); b = s.index('\n', a) + 1
# drop the comment block just above the call too
c = s.rfind('\n\n', 0, a) + 2
s = s[:c] + s[b:]
a = s.index('            <ShelfLink '); c = s.rfind('          <div', 0, a); b = s.index('          </div>\n', a) + len('          </div>\n')
s = s[:c] + s[b:]

# keys, routes, ids
for a2, b2 in [("sot_jig_", "sot_saw_"), ("/api/jig/img", "/api/saw/img"), ("jgpic-", "swpic-"),
               ("isLoft('jig')", "isLoft('saw')"), ("isStage('jig'", "isStage('saw'"),
               ("gameColor('jig')", "gameColor('saw')"), ("gameColorLight('jig')", "gameColorLight('saw')"),
               ("gameOnrampLight('jig')", "gameOnrampLight('saw')"), ("gameAccentInkLight('jig')", "gameAccentInkLight('saw')"),
               ("hintAllowed('jig'", "hintAllowed('saw'"), ("spendHint('jig')", "spendHint('saw')"),
               ("game: 'jig'", "game: 'saw'"), ("self: 'jig'", "self: 'saw'"), ('self="jig"', 'self="saw"'),
               ('slug="jig"', 'slug="saw"'), ('gameKey="jig"', 'gameKey="saw"'), ('name="Jig"', 'name="Saw"'),
               ("`/jig?p=${", "`/saw?p=${"), ('href="/jig"', 'href="/saw"'), ("mindloftdaily.com/jig", "mindloftdaily.com/saw"),
               ("export default function JigClient", "export default function SawClient")]:
    if a2 not in s:
        sys.exit(f'fork-saw-client: {a2!r} not found')
    s = s.replace(a2, b2)

# words
R("`Jig #${PUZZLE.num}${PUZZLE.sunday ? ' · Sunday' : ''} · ${NP} pieces in ${elapsed}${peekBit}${streakBit}`", "`Saw #${PUZZLE.num} · ${NP} pieces in ${elapsed}${peekBit}${streakBit}`")
R("`Jig #${PUZZLE.num}, the daily jigsaw from Mind Loft.", "`Saw #${PUZZLE.num}, the tall daily jigsaw from Mind Loft.")
R("Every day is cut into 80 pieces.", "Every Saw photo stands tall and is cut into 77 or 80 pieces.")
R("Put the picture back together. Today's photo is cut", "Put the picture back together. Today's photo stands tall and is cut")
R("`Jig table, ${biggest}", "`Saw table, ${biggest}")
R("`Jig #${PUZZLE.num} · gave up at ${LOOSE", "`Saw #${PUZZLE.num} · gave up at ${LOOSE")
R("Today&rsquo;s photo is cut into {NP} pieces", "Today&rsquo;s tall photo is cut into {NP} pieces")
R(": `Jig board,", ": `Saw board,")
R("Next Jig in", "Next Saw in")
R("play yesterday&rsquo;s Jig &rarr;", "play yesterday&rsquo;s Saw &rarr;")
R("Back to today&rsquo;s Jig &rarr;", "Back to today&rsquo;s Saw &rarr;")
R("Jig all time` : 'all-time rank'", "Saw all time` : 'all-time rank'")
R("label: 'Play another Jig'", "label: 'Play another Saw'")
R("Add Jig to your Home Screen", "Add Saw to your Home Screen")

# about
a = s.index('About Jig</h2>'); a = s.rfind('        <h2', 0, a); b = s.index('      </section>', a)
s = s[:a] + """        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: INK }}>About Saw</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Saw is a free daily online jigsaw puzzle from Mind Loft, the tall sibling of <a href="/jig" style={{ color: INK, fontWeight: 800 }}>Jig</a>. Every day brings a new portrait photograph, a featured picture from Wikimedia Commons, cut taller than wide into 77 or 80 classic interlocking pieces. Everyone gets the same picture and the same cut, so the daily leaderboard is a fair race.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          On a computer you build it on a loose table: a piece stays where you drop it, and two that belong together lock when they meet. On a phone each piece snaps into its own spot. Pieces never need turning. Sort the tray into edge pieces and the middle, or one of the picture&rsquo;s colors and the rest. Peek shows the whole picture for a moment and adds 15 seconds to the clock. On a phone the board and the tray share one box: the board scrolls inside it and the plus button makes it bigger. Full screen gives the board and the tray the whole screen.
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: FADED, fontWeight: 600 }}>
          Finish the picture for a perfect 10; the fastest time tops the board. No app, no signup, play free in your browser. Want a wide picture? <a href="/jig" style={{ color: INK, fontWeight: 800 }}>Jig</a> is the same daily jigsaw on a landscape photo, and the photos from both come back later in <a href="/swap" style={{ color: INK, fontWeight: 800 }}>Swap</a>, <a href="/slide" style={{ color: INK, fontWeight: 800 }}>Slide</a> and <a href="/spin" style={{ color: INK, fontWeight: 800 }}>Spin</a>.
        </p>
""" + s[b:]

# A tall board on a wide screen is never taller than the window allows.
R("""            <div className={`jg-boardbox${boxMode && zoom > 1 ? ' scr' : ''}`} ref={boxRef} style={full && fitW ? { width: fitW } : undefined}>""",
  """            <div className={`jg-boardbox${boxMode && zoom > 1 ? ' scr' : ''}`} ref={boxRef} style={full && fitW ? { width: fitW } : (narrow ? undefined : { maxWidth: `max(320px, calc((100vh - 230px) * ${((BW + 2 * BP) / (BH + 2 * BP)).toFixed(3)}))` })}>""")

left = [m.start() for m in re.finditer(r'\bJig\b', s)]
open('app/saw/SawClient.jsx', 'w').write(s)
print(f'fork-saw-client: wrote app/saw/SawClient.jsx ({len(left)} mentions of Jig left, all links to it)')
