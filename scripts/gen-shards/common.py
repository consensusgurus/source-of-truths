import os
import sys, json
from wordfreq import zipf_frequency, top_n_list

DICT = set(w.strip() for w in open(os.path.join(os.path.dirname(__file__),'..','..','public','tuck-dict.txt')) if w.strip())

# offensive / undesirable fill words kept out of GRIDS (validation dict still allows
# them for uniqueness, but they never appear in an authored solution).
BLOCK = set("""
ass arse damn crap piss slut turd twat wog kike spic dago coon jap gyp
fag fags anal butt scum std sluts pube pubes puke boob boobs bra bras
nazi nazis rape raped rapes rapist hell dammit dumb ugly fart farts snot
urine urinal semen sperm vomit mucus phlegm feces faeces
""".split())


# ---- proper-noun veto + a stricter bar for the shortest slots ----------------
# Two separate lessons, both learned the same way (owner rule, 2026-08-19):
#
#   1. A frequency floor does not mean "a word a reader knows" at short lengths.
#      Two-letter strings are inflated by abbreviations (st 5.20, from Street and
#      Saint) and by foreign text in an English corpus (ja 3.71, si 4.17), so 108
#      of the 124 two-letter words in tuck-dict.txt cleared zipf 3.5 and filled
#      grids with ST, JA, PE, KY. Three-letter slots are the same problem one size
#      up: ING, ONS, ENG, REC, TAE, ISH and HEH all clear 3.5.
#   2. wordfreq is case-insensitive, so first names score like common words
#      (dan 4.51, ted, lee). Only a case-sensitive dictionary can tell them apart.
#
# So: LEN2 is empty (no template has a two-letter slot any more, and an empty pool
# means a stray one could never be filled); length 3 must be a LOWERCASE entry in
# en_US.hunspell and clear a higher floor; every length drops words hunspell knows
# only as a capitalised proper noun. Lengths 4+ keep the ordinary 3.5 floor, whose
# tail (moth, avid, mesa, hive) is already ordinary English.
HUNSPELL = '/usr/share/hunspell/en_US.dic'
SHORT_LEN = 3          # the length that needs the dictionary check
SHORT_ZMIN = 4.0       # and the higher frequency floor

def _hunspell():
    low, cap = set(), set()
    try:
        fh = open(HUNSPELL, encoding='utf-8', errors='replace')
    except OSError:
        raise SystemExit(
            f"missing {HUNSPELL}: install hunspell-en-us before generating a bank. "
            "Without it the proper-noun veto silently stops working and names "
            "(DAN, LEE, TED) come back as answers.")
    with fh:
        for line in fh:
            w = line.split('/')[0].strip()
            if not w.isalpha():
                continue
            (low if w.islower() else cap).add(w.lower())
    return low, cap - low

HUN_LOW, HUN_CAPONLY = _hunspell()

# Names that survive both filters because they are also spelled like a common word,
# so hunspell lists them lowercase and wordfreq scores them like ordinary vocabulary.
# A solver with no clues reads these as names, whatever the dictionary says they are.
NAMES = set("""
ann del ken lee mac sri ted tom
batman gilbert logan sheila kyle stein shaw
anna ariel brad leone sonny teddy otto trump
john maria maya randy homer tesla lakers carter modi troy august germans lang canton noel
monte grande milo roger ulster harry holt peter miller dell bing yahoo manila glen
tony martin terry silva marc bach turner fiat wiki
""".split())

# Dec restock (2026-11-12): identity and nationality words, and chat spellings,
# kept out of GRIDS (still valid for the uniqueness proof via DICT).
BLOCK |= set("""
afghan latino lesbian gay nah haha tho til autism fetish gov sec
meth bong moron idiot idiots dope thru dunno dudes imam
""".split())

# US spellings only (the standing bank rule; an off-the-shelf word list carries both).
BRITISH = set("""
honour colour favour labour humour rumour vapour armour behaviour neighbour harbour
parlour saviour flavour splendour endeavour centre theatre litre metre fibre sabre
calibre sombre lustre defence offence pretence licence practise realise realised
organise organised recognise apologise analyse analysed paralyse catalogue dialogue
programme plough draught kerb tyre pyjamas aluminium moustache jewellery travelling
cancelled labelled modelled marvellous woollen enrol fulfil instil skilful wilful gaol
cheque storey mould smoulder plait aeroplane
learnt spelt dreamt leant spoilt smelt
""".split())


def build_common(maxlen=7, zmin=3.2):
    common = {}
    for w in DICT:
        L = len(w)
        if L < 2 or L > maxlen: continue
        if not w.isalpha(): continue
        if w in BLOCK or w in NAMES or w in BRITISH: continue
        if L < SHORT_LEN: continue                    # no two-letter slots exist
        if w in HUN_CAPONLY: continue                 # a proper noun, not a word
        if L == SHORT_LEN and w not in HUN_LOW: continue
        z = zipf_frequency(w, 'en')
        if z < (SHORT_ZMIN if L == SHORT_LEN else zmin): continue
        common.setdefault(L, []).append((w, z))
    out = {}
    for L, lst in common.items():
        lst.sort(key=lambda x:-x[1])
        out[L] = [w for w,_ in lst]
    return out

if __name__ == '__main__':
    for zmin in (3.0, 3.2, 3.5, 4.0):
        c = build_common(7, zmin)
        print('zmin', zmin, {L: len(c.get(L,[])) for L in range(2,8)})
