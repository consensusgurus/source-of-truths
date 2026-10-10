# Freeze the word data Lode scores with: a frequency per word, and a vocabulary
# gate that decides which words are allowed on a board at all.
#
# TWO shipped word lists feed this, and both are read whole:
#
#   public/tuck-dict.txt       2 to 8 letters   (frozen; the rack games' corpus)
#   public/tuck-dict-long.txt  9 to 15 letters
#
# Lode read only the first of those until 2026-08-15, which meant NO WORD OF
# NINE LETTERS OR MORE existed on any board, ever. That is not a tuning choice,
# it is a hole: seven reusable letters build long words constantly, so players
# typed BEGINNING, COHERENCE, INITIALLY, ABBREVIATE, INVALUABLE and ABOLITION
# and were told they were not words. Reading both lists is the fix. Neither
# file is modified here (tuck-dict.txt stays frozen at 2 to 8 because the rack
# games' bank verifiers reason over it); this script only reads them.
#
# SCORE comes from `wordfreq`'s Zipf scale (roughly 1 = vanishingly rare, 7 =
# "the"), which the generator turns into the rarity tiers the whole game is
# built on.
#
# The JUNK FILTER used to be the Zipf floor alone, and that was the flaw this
# script exists to fix. Proper nouns are frequent, so a floor high enough to
# stop "paul" and "texas" also stops ordinary vocabulary that simply is not
# written down much: lard 2.98, howl 3.18, silt 2.96, coax 2.96, hilt 2.90,
# faze 2.91, cowl 2.87, ruse 3.16, yelp 3.25. Players typed those and got
# bounced, which is exactly the wrong failure. Frequency cannot separate "a word
# nobody knows" from "a word nobody writes"; only a dictionary can.
#
# So a spelling dictionary is the primary gate. Hunspell's en_US is
# CASE SENSITIVE, which is the property that does the work here: `lard` is in it
# and `moby`, `aida`, `pele`, `zulu` and `gump` are not, because those exist only
# as capitalized names.
#
# en_GB then runs as a SECOND dictionary, and the ORDER OF THE TWO IS THE WHOLE
# DESIGN. en_GB is NOT case sensitive the way en_US is: it answers yes to
# `broadway`, `canterbury`, `kirk`, `bonnie` and `carmen` in lowercase, so it
# carries no proper-noun signal at all and can never be the gate. It runs only
# AFTER en_US has already vetoed the names, where its one job is to recognise
# the British spellings en_US genuinely does not know. Classes, in order:
#
#   known           en_US knows the lowercase -> real vocabulary, allowed even
#                   well below the old floor.
#   proper noun     en_US knows only the Capitalized form -> a name, dropped
#                   however often it is written. This is what clears james,
#                   november, michael, india, texas and facebook off the boards,
#                   and it runs BEFORE en_GB so none of them come back.
#   british         neither form is in en_US, but en_GB knows the lowercase ->
#                   a British spelling (gaol, moult, oedema, racoon, rouble,
#                   leant, paralyse, encyclopaedic, and the whole -ise / -isation
#                   family). Admitted on the same terms as `known`.
#   unknown to both compounds, slang, and some junk. Kept only if it already
#                   cleared the OLD floor, so no change here has ever taken away
#                   a word a player could type before it shipped.
#
# Run once and commit the output; the generator reads the JSON, so a build never
# needs Python, wordfreq or a hunspell dictionary:
#     apt install hunspell-en-us hunspell-en-gb
#     pip install wordfreq spylls --break-system-packages
#     python3 scripts/lode-words.py > scripts/.lode-freq.json
#
# Dictionary paths default to the system ones; override with LODE_HUNSPELL and
# LODE_HUNSPELL_GB. A missing dictionary is a hard error rather than a silent
# skip: degrading to en_US alone would quietly drop a few hundred words and
# nobody would notice until a player complained.
import json
import os
import sys

from spylls.hunspell import Dictionary
from wordfreq import zipf_frequency

HERE = os.path.dirname(os.path.abspath(__file__))
DICTS = [
    os.path.join(HERE, "..", "public", "tuck-dict.txt"),
    os.path.join(HERE, "..", "public", "tuck-dict-long.txt"),
]
HUNSPELL = os.environ.get("LODE_HUNSPELL", "/usr/share/hunspell/en_US")
HUNSPELL_GB = os.environ.get("LODE_HUNSPELL_GB", "/usr/share/hunspell/en_GB")

# THERE IS NO FREQUENCY FLOOR (owner call, 2026-08-17). The only bars a word has
# to clear are the LETTER MINIMUM (four) and the proper-noun veto below. Every
# other word in the shipped corpus is scored.
#
# The floor came down in three steps and it is worth knowing why it went all the
# way. It started as the ONLY junk filter, so it had to be high enough to stop
# proper nouns, which are frequent; that also stopped ordinary vocabulary nobody
# writes down (lard, howl, silt, coax, ruse). The hunspell gate took the
# proper-noun job in July, and the floor dropped to 1.5 in the morning of
# 2026-08-17, which admitted another 18,111 words (rile, glob, clef, gild, dolt,
# kith, mien, riffraff, ogled). Players still hit refusals, so the floor went
# entirely: a curated pool always omits SOMETHING, and every omission reads to a
# player as "that is not a word".
#
# What this costs, stated plainly so nobody re-adds a floor by accident: about
# 167,500 of the words now scored have NO recorded usage at all (eild, pumy,
# skirrs, konbus, solpugids). They are real dictionary words and they count, but
# they are scored at the BASE rate rather than the rare multiplier — see the
# zero-frequency branch of tierOf in gen-lode.mjs. Without that branch they
# would each have paid TREBLE, taking the median board's rare share from 0.25 to
# 0.49 and making a Scrabble list the fastest way to win, which is the exact
# opposite of what the rarity scoring is for.
#
# A word with no wordfreq entry is emitted with a frequency of 0.0, which is the
# signal the generator keys the base-rate branch off. It is NOT a missing value.
FLOOR = None

# Retained ONLY for the grandfather bookkeeping in the stats below; no word is
# excluded on frequency any more.
OLD = {4: 3.4, 5: 2.6, 6: 2.25}
OLD_LONG = 2.1

# Words hunspell en_US files as capitalized-only that are still worth playing.
# The proper-noun veto runs before en_GB precisely so that names stay out, which
# means the handful of real words caught in that net have to be named here.
# Three groups: British spellings en_US only knows as surnames (Grey, Armour,
# Sabre, Tyre), genericized trademarks people write lowercase (velcro, kleenex,
# frisbee, teflon), and common nouns that share a capitalized sense (tory,
# realtor, parmesan, merlot, labrador). Everything else the proper-noun class
# catches is a genuine name, and names have no business on a word board.
KEEP = {
    # British spellings en_US knows only as names
    "grey", "coloured", "armour", "sabre", "tyre",
    # genericized trademarks, routinely lowercase
    "velcro", "kleenex", "frisbee", "teflon", "vaseline", "popsicle", "lycra",
    "formica", "valium", "humvee", "foosball",
    # food and drink written lowercase
    "parmesan", "merlot", "pinot", "chianti", "riesling", "marsala",
    # common nouns and adjectives with a capitalized sense
    "tory", "tories", "realtor", "afro", "cajun", "nordic", "utopian",
    "labrador", "savannah", "sherpa", "siamese", "maltese", "quaker",
    "jesuit", "flemish", "muppet", "jedi",
    # British and everyday words a player types lowercase (owner, 2026-10-10:
    # a reader in England had MATT, the paint finish, banked as a tailing)
    "matt", "biro", "biros", "mack", "macks", "goth", "goths", "geez", "gruyere", "gamay", "akita", "akitas", "pyrex", "mylar", "henley", "henleys",
}


def old_floor(n):
    return OLD.get(n, OLD_LONG)


def open_dict(path, label):
    try:
        return Dictionary.from_files(path)
    except Exception as exc:
        sys.exit(
            f"lode-words: cannot open the {label} dictionary at {path} ({exc}).\n"
            f"Install it (apt install hunspell-en-us hunspell-en-gb) or point "
            f"LODE_HUNSPELL / LODE_HUNSPELL_GB at it. Running without one would "
            f"silently change which words the game accepts."
        )


spell = open_dict(HUNSPELL, "en_US")
spell_gb = open_dict(HUNSPELL_GB, "en_GB")
_seen = {}


def classify(w):
    """'known', 'proper', 'british' or 'unknown' - see the header. The en_US
    proper-noun test runs BEFORE en_GB is consulted, because en_GB answers yes
    to lowercase names and would let every one of them back in."""
    if w not in _seen:
        if spell.lookup(w):
            _seen[w] = "known"
        elif spell.lookup(w.capitalize()):
            _seen[w] = "proper"
        elif spell_gb.lookup(w):
            _seen[w] = "british"
        else:
            _seen[w] = "unknown"
    return _seen[w]


words = set()
for path in DICTS:
    with open(path, encoding="utf8") as fh:
        for line in fh:
            w = line.strip().lower()
            if len(w) >= 4:
                words.add(w)

# THE REFRESH IS STRICTLY ADDITIVE: every word already in the frozen file stays
# in it. The script has always claimed that no change here takes away a word a
# player could type before it shipped, but until 2026-08-17 that was a property
# of the rules happening to widen rather than something enforced, so any future
# tightening — or a differently-built hunspell — would silently drop words.
# A dictionary is not perfectly reproducible across machines: the en_GB packaged
# for one distribution knows gaol, racoon and leant while another's does not, and
# re-running on the second machine would quietly delete them from the game. So
# the previous output is read back and unioned in. The frequency is refreshed
# (wordfreq moves), only the membership is sticky.
#
# To genuinely REMOVE a word, delete it from the frozen file and re-run, or run
# with LODE_REBUILD=1 for a clean rebuild that honours only today's rules.
PREV_PATH = os.path.join(HERE, ".lode-freq.json")
prev = {}
if not os.environ.get("LODE_REBUILD"):
    try:
        with open(PREV_PATH, encoding="utf8") as fh:
            prev = json.load(fh)
    except FileNotFoundError:
        pass

out = {}
stats = {"known": 0, "proper": 0, "british": 0, "unknown": 0,
         "dropped_proper": 0, "below": 0, "kept_prior": 0, "added": 0}

for w in sorted(words):
    z = zipf_frequency(w, "en")
    was = w in prev
    cls = classify(w)
    stats[cls] += 1

    # THE ONLY EXCLUSION LEFT. A name is a name however often it is written, and
    # a word board full of india, michael, jordan and texas is a different game.
    # This is a DICTIONARY gate, not a frequency one, so removing the floor did
    # not remove it. Excluded words are not refused to the player either: they
    # fall through to the board's `extra` list and are accepted as tailings, so
    # nothing a player types is ever called a non-word.
    if cls == "proper" and w not in KEEP and not was:
        stats["dropped_proper"] += 1
        continue

    if was:
        stats["kept_prior"] += 1  # already shipped; never taken back
    else:
        stats["added"] += 1

    # 0.0 means wordfreq has no entry: a real word nobody has written down in the
    # reference corpus. The generator scores these at the base rate.
    out[w] = round(z, 2)

missing = [w for w in prev if w not in out]
if missing:
    sys.exit(
        f"lode-words: {len(missing)} words in {PREV_PATH} are not in the corpus "
        f"any more (e.g. {', '.join(sorted(missing)[:8])}). The refresh must be "
        f"additive, so this is a bug rather than a tuning result."
    )

print(json.dumps(out, separators=(",", ":"), sort_keys=True))
nofreq = sum(1 for v in out.values() if v == 0)
print(
    f"{len(out)} words kept ({stats['kept_prior']} already shipped, "
    f"{stats['added']} newly admitted) - {nofreq} have no recorded usage and "
    f"score at the base rate - dropped {stats['dropped_proper']} proper nouns "
    f"(the ONLY exclusion) - classes: {stats['known']} known / "
    f"{stats['british']} british / {stats['proper']} proper / "
    f"{stats['unknown']} unknown to either",
    file=sys.stderr,
)
