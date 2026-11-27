# Restock one 6x6 small-sudoku bank, append only.
#
#   python3 scripts/small-sudoku/append.py <key> <untilISO>
#
# Reads app/<key>/puzzles.js (through node), builds one board for every day
# after its last board through <untilISO> with the same recipe as bank.py
# (minimal dig, weekday add-back, Cages sizes by weekday), and APPENDS them in
# write_banks.py's row format. The frozen boards are never rewritten. Seeds are
# offset by the board number, and a board is refused when its answer grid is
# anywhere in this bank, or within 14 days of the same grid in its family
# (kayak + kayaktoo, lip + liptoo), the rule small-sudokus-verify.mjs checks,
# and when the printed digits alone solve it as a plain sudoku (the variant
# rule would be decoration; small-sudokus-verify fails that too).
# Re-run scripts/small-sudokus-verify.mjs afterwards.
import sys, os, json, datetime, subprocess, zlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from games import GAMES
from engine import count_solutions
from make import one
from bank import ADD, CAGE_SIZES

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
KIND = {'kayak': 'racecar', 'lip': 'rim', 'fever': 'mercury', 'snack': 'sando', 'coop': 'cages', 'dart': 'arrow',
        'trim': 'frame', 'bout': 'sumo', 'dot': 'polka', 'kayaktoo': 'racecar', 'liptoo': 'rim'}
FAMILY = {'kayak': ['kayaktoo'], 'kayaktoo': ['kayak'], 'lip': ['liptoo'], 'liptoo': ['lip']}
M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']


def load(key):
    js = f"import('{ROOT}/app/{key}/puzzles.js').then(m=>process.stdout.write(JSON.stringify(m.PUZZLES.map(p=>({{num:p.num,live:p.live,sol:p.sol.flat()}})))))"
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)


def g6(a): return [a[r * 6:(r + 1) * 6] for r in range(6)]


def row(key, kind, n, b):
    d = datetime.date.fromisoformat(b['live']); e = b['export']
    f = [f"    num: {n},", f"    quizId: '{key}-{d.month}-{d.day}-{str(d.year)[2:]}',", f"    live: '{b['live']}',",
         f"    dateLabel: '{M[d.month - 1]} {d.day}, {d.year}',",
         f"    sunday: {'true' if b['sunday'] and kind != 'polka' else 'false'},", f"    printed: {b['printed']},"]
    c = (',', ':')
    if kind in ('sando', 'frame'): f.append(f"    clues: {b['printed']},")
    if kind == 'mercury': f.append(f"    thermos: {json.dumps(e['thermos'], separators=c)},")
    if kind == 'racecar': f.append(f"    lines: {json.dumps(e['lines'], separators=c)},")
    if kind == 'arrow': f.append(f"    arrows: {json.dumps(e['arrows'], separators=c)},")
    if kind == 'rim': f.append(f"    rim: {json.dumps(e['rim'], separators=c)},")
    if kind == 'sando': f.append(f"    rowSums: {json.dumps(e['rowSums'], separators=c)},\n    colSums: {json.dumps(e['colSums'], separators=c)},")
    if kind == 'frame': f.append(f"    sums: {json.dumps(e['sums'], separators=c)},")
    if kind == 'sumo': f.append(f"    h: {json.dumps(e['h'])},\n    v: {json.dumps(e['v'])},")
    if kind == 'polka': f.append(f"    dots: {json.dumps(e['dots'], separators=c)},")
    if kind == 'cages':
        cage = e['cage']; flat = sum(cage, [])
        f.append(f"    cages: {len(e['sums'])},\n    big: {max(flat.count(k) for k in set(flat))},\n    cage: {json.dumps(cage, separators=c)},\n    sums: {json.dumps(e['sums'], separators=c)},")
    if kind not in ('cages', 'polka'): f.append(f"    given: {json.dumps(g6(b['given']), separators=c)},")
    f.append(f"    sol: {json.dumps(g6(b['sol']), separators=c)},")
    return '  {\n' + '\n'.join(f) + '\n  },'


def main(key, until):
    kind = KIND[key]; g = GAMES[kind]
    bank = load(key)
    near = [(p['live'], tuple(p['sol'])) for k in FAMILY.get(key, []) for p in load(k)]
    own = {tuple(p['sol']) for p in bank}
    last = bank[-1]; n = last['num']
    assert n == len(bank), f'{key}: nums not contiguous'
    d = datetime.date.fromisoformat(last['live']) + datetime.timedelta(days=1)
    end = datetime.date.fromisoformat(until)
    seed0 = (zlib.crc32(key.encode()) % 9000 + 1000) * 100000
    rows = []
    while d <= end:
        n += 1; wd = d.weekday()
        if kind == 'cages': g.sizes = CAGE_SIZES[wd]
        k = 0
        while True:
            sol, st, minimal, removed = one(g, seed0 + n * 7919 + k); k += 1
            t = tuple(sol)
            if t in own: continue
            if any(s == t and abs((datetime.date.fromisoformat(lv) - d).days) < 14 for lv, s in near): continue
            units = minimal + removed[:ADD[wd]] if g.units(sol, st) else []
            # the rule must carry weight: the printed digits alone, read as a plain
            # sudoku, may not pin the grid (Monday's add-back can make it decoration)
            if count_solutions(GAMES['plain'].base(), g.given_from(units, sol)) < 2: continue
            break
        own.add(tuple(sol))
        b = {'live': d.isoformat(), 'sunday': wd == 6, 'sol': sol, 'given': g.given_from(units, sol),
             'export': g.export(units, sol, st),
             'printed': sum(1 for u in units if u[0] == 'g') if kind != 'rim' else len(units)}
        rows.append(row(key, kind, n, b))
        print(key, n, b['live'], b['printed'], flush=True)
        d += datetime.timedelta(days=1)
    if not rows: print(key, 'already runs to', last['live']); return
    path = f'{ROOT}/app/{key}/puzzles.js'
    text = open(path).read()
    close = text.rstrip().rfind('];')
    open(path, 'w').write(text[:close] + '\n'.join(rows) + '\n];\n')
    print(f'{key}: +{len(rows)} boards through {until}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
