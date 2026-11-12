"""Spot board builder. Ops are written in VIEW coordinates (the photo scaled to
1200 px wide, which is what the gridded overview shows) and applied at full
resolution. Usage:  python3 spotkit.py grid <id>   |   python3 spotkit.py build <id>
Board specs live in boards.py as BOARDS[id] = dict(src=..., ops=[...])."""
import cv2, numpy as np, json, sys, os, hashlib

VIEW = 1200
OUT_W = 1600
HERE = os.path.dirname(os.path.abspath(__file__))


def load(src):
    im = cv2.imread(os.path.join(HERE, 'src', src))
    assert im is not None, src
    return im


def grid(bid, src, crop=None, zoom=1.0):
    im = load(src)
    H, W = im.shape[:2]
    k = VIEW / W
    v = cv2.resize(im, (VIEW, round(H * k)), interpolation=cv2.INTER_AREA)
    x0, y0, x1, y1 = (0, 0, VIEW, v.shape[0]) if not crop else crop
    if crop:
        kk = W / VIEW
        v = im[round(y0 * kk):round(y1 * kk), round(x0 * kk):round(x1 * kk)]
        f = zoom * VIEW / W
        v = cv2.resize(v, None, fx=f, fy=f, interpolation=cv2.INTER_CUBIC)
    step = 100 if not crop else (20 if zoom >= 3 else 50)
    sc = 1.0 if not crop else zoom
    gx = (x0 // step) * step
    while gx <= x1:
        px = int((gx - x0) * sc)
        if 0 <= px < v.shape[1]:
            cv2.line(v, (px, 0), (px, v.shape[0]), (255, 255, 255), 1)
            cv2.putText(v, str(gx), (px + 2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 3)
            cv2.putText(v, str(gx), (px + 2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        gx += step
    gy = (y0 // step) * step
    while gy <= y1:
        py = int((gy - y0) * sc)
        if 0 <= py < v.shape[0]:
            cv2.line(v, (0, py), (v.shape[1], py), (255, 255, 255), 1)
            cv2.putText(v, str(gy), (2, py - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 3)
            cv2.putText(v, str(gy), (2, py - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
        gy += step
    out = os.path.join(HERE, 'out', f'{bid}_grid.jpg')
    cv2.imwrite(out, v, [cv2.IMWRITE_JPEG_QUALITY, 86])
    return out


class Board:
    def __init__(self, bid, src):
        self.bid = bid
        self.A = load(src)
        self.B = self.A.copy()
        self.H, self.W = self.A.shape[:2]
        self.k = self.W / VIEW
        self.regs = []
        self.rng = np.random.default_rng(11)

    # -- helpers ------------------------------------------------------------
    def S(self, v):
        return int(round(v * self.k))

    def box(self, b):
        x0, y0, x1, y1 = [self.S(t) for t in b]
        return max(0, x0), max(0, y0), min(self.W, x1), min(self.H, y1)

    def shape_mask(self, shape):
        m = np.zeros((self.H, self.W), np.uint8)
        kind, v = shape[0], shape[1:]
        if kind == 'box':
            x0, y0, x1, y1 = self.box(v)
            m[y0:y1, x0:x1] = 255
        elif kind == 'ell':
            cx, cy, rx, ry = [self.S(t) for t in v]
            cv2.ellipse(m, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)
        elif kind == 'poly':
            pts = np.array([[self.S(x), self.S(y)] for x, y in v[0]], np.int32)
            cv2.fillPoly(m, [pts], 255)
        else:
            raise ValueError(kind)
        return m

    def feather(self, m, px=3.0):
        return cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), px * self.k / 1.6)[..., None]

    def blend(self, new, m, px=3.0):
        a = self.feather(m, px)
        self.B = np.clip(new.astype(np.float32) * a + self.B.astype(np.float32) * (1 - a), 0, 255).astype(np.uint8)

    def reg(self, m, label, pad=0):
        ys, xs = np.where(m > 0)
        assert len(xs), label
        x0, x1 = np.percentile(xs, [0.5, 99.5])
        y0, y1 = np.percentile(ys, [0.5, 99.5])
        mn = 0.021 * self.W
        rx = max((x1 - x0) / 2 * 1.12 + pad * self.k, mn)
        ry = max((y1 - y0) / 2 * 1.12 + pad * self.k, mn)
        self.regs.append(dict(label=label, x=(x0 + x1) / 2 / self.W, y=(y0 + y1) / 2 / self.H, rx=rx / self.W, ry=ry / self.W))

    # -- ops ----------------------------------------------------------------
    def recolor(self, label, box, hue=None, seed=None, by='hue', tol=12, min_s=None, min_v=None, sat=1.0, val=1.0,
                set_sat=None, comp=True, shift=None, feather=2.0, close=7, grow=0, shape=None, region=None, seed_hsv=None):
        x0, y0, x1, y1 = self.box(box)
        hsv = cv2.cvtColor(self.B, cv2.COLOR_BGR2HSV).astype(np.float32)
        sub = hsv[y0:y1, x0:x1]
        sx, sy = (self.S(seed[0]), self.S(seed[1])) if seed else ((x0 + x1) // 2, (y0 + y1) // 2)
        patch = hsv[max(0, sy - 3):sy + 4, max(0, sx - 3):sx + 4].reshape(-1, 3)
        sh, ss, sv = np.median(patch, axis=0)
        if seed_hsv:
            sh, ss, sv = seed_hsv
        if by == 'hue':
            dh = np.abs(sub[..., 0] - sh)
            dh = np.minimum(dh, 180 - dh)
            m = (dh <= tol) & (sub[..., 1] >= (min_s if min_s is not None else ss * 0.45)) & (sub[..., 2] >= (min_v if min_v is not None else sv * 0.3))
        else:  # by lab distance (for whites, greys, blacks)
            lab = cv2.cvtColor(self.B, cv2.COLOR_BGR2LAB).astype(np.float32)
            sl = np.median(lab[max(0, sy - 3):sy + 4, max(0, sx - 3):sx + 4].reshape(-1, 3), axis=0)
            m = np.linalg.norm(lab[y0:y1, x0:x1] - sl, axis=2) <= tol
        m = m.astype(np.uint8) * 255
        if close:
            m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((close, close), np.uint8))
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        if comp:
            n, lab_, st, _ = cv2.connectedComponentsWithStats(m)
            lx, ly = sx - x0, sy - y0
            c = lab_[min(max(ly, 0), m.shape[0] - 1), min(max(lx, 0), m.shape[1] - 1)]
            if c == 0:
                c = 1 + int(np.argmax(st[1:, 4]))
            m = ((lab_ == c) * 255).astype(np.uint8)
        if grow:
            m = cv2.dilate(m, np.ones((grow, grow), np.uint8))
        full = np.zeros((self.H, self.W), np.uint8)
        full[y0:y1, x0:x1] = m
        if shape is not None:
            full = cv2.bitwise_and(full, self.shape_mask(shape))
        h2 = hsv.copy()
        if hue is not None:
            h2[..., 0] = hue
        if shift is not None:
            h2[..., 0] = (h2[..., 0] + shift) % 180
        if set_sat is not None:
            h2[..., 1] = set_sat
        h2[..., 1] = np.clip(h2[..., 1] * sat, 0, 255)
        h2[..., 2] = np.clip(h2[..., 2] * val, 0, 255)
        rec = cv2.cvtColor(h2.astype(np.uint8), cv2.COLOR_HSV2BGR)
        self.blend(rec, full, feather)
        self.reg(self.shape_mask(region) if region else full, label)

    def remove(self, label, shape, rad=6, grain=0.6, feather=3.0, pad=0):
        m = self.shape_mask(shape)
        out = cv2.inpaint(self.B, m, int(rad * self.k / 1.6) or 3, cv2.INPAINT_TELEA)
        if grain:
            ring = cv2.dilate(m, np.ones((31, 31), np.uint8)) - m
            g = cv2.cvtColor(self.B, cv2.COLOR_BGR2GRAY).astype(np.float32)
            hp = g - cv2.GaussianBlur(g, (0, 0), 2)
            v = hp[ring > 0]
            sd = float(np.median(np.abs(v - np.median(v))) * 1.4826)
            n = cv2.GaussianBlur(self.rng.normal(0, 1, (self.H, self.W)).astype(np.float32), (0, 0), 0.7) * sd * 1.3 * grain
            out = np.clip(out.astype(np.float32) + n[..., None], 0, 255).astype(np.uint8)
        self.blend(out, m, feather)
        self.reg(m, label, pad)

    def hfill(self, label, shape, grain=0.5, feather=1.5, vertical=False):
        """Fill a box by interpolating across it from the pixels just outside its
        left and right edges (or top and bottom). For things standing against sky."""
        x0, y0, x1, y1 = self.box(shape[1:])
        new = self.B.astype(np.float32).copy()
        if vertical:
            top = self.B[max(0, y0 - 4):y0 - 1, x0:x1].astype(np.float32).mean(axis=0)
            bot = self.B[y1 + 1:y1 + 4, x0:x1].astype(np.float32).mean(axis=0)
            t = np.linspace(0, 1, y1 - y0)[:, None, None]
            new[y0:y1, x0:x1] = top[None] * (1 - t) + bot[None] * t
        else:
            lef = self.B[y0:y1, max(0, x0 - 4):x0 - 1].astype(np.float32).mean(axis=1)
            rig = self.B[y0:y1, x1 + 1:x1 + 4].astype(np.float32).mean(axis=1)
            lef = cv2.GaussianBlur(lef[:, None, :], (1, 0), 0, sigmaY=2)[:, 0, :] if False else lef
            t = np.linspace(0, 1, x1 - x0)[None, :, None]
            new[y0:y1, x0:x1] = lef[:, None] * (1 - t) + rig[:, None] * t
        g = cv2.cvtColor(self.B, cv2.COLOR_BGR2GRAY).astype(np.float32)
        hp = g - cv2.GaussianBlur(g, (0, 0), 2)
        ring = hp[max(0, y0 - 12):y1 + 12, max(0, x0 - 12):x1 + 12]
        sd = float(np.median(np.abs(ring - np.median(ring))) * 1.4826)
        n = cv2.GaussianBlur(self.rng.normal(0, 1, (self.H, self.W)).astype(np.float32), (0, 0), 0.7) * sd * 1.3 * grain
        new = np.clip(new + n[..., None], 0, 255).astype(np.uint8)
        m = np.zeros((self.H, self.W), np.uint8)
        m[y0:y1, x0:x1] = 255
        self.blend(new, m, feather)
        self.reg(m, label)

    def fill(self, label, shape, pick='bright', feather=1.5, grain=0.5, only=None):
        """Paint a shape with its own ground colour (a blank plate, a blank sign)."""
        m = self.shape_mask(shape)
        px = self.B[m > 0].astype(np.float32)
        lum = px @ np.array([0.114, 0.587, 0.299], np.float32)
        sel = px[lum >= np.percentile(lum, 70)] if pick == 'bright' else px[lum <= np.percentile(lum, 30)] if pick == 'dark' else px
        col = np.median(sel, axis=0)
        # keep the ground's own slow shading
        base = cv2.GaussianBlur(self.B, (0, 0), 9 * self.k / 1.6).astype(np.float32)
        mean = base[m > 0].mean(axis=0)
        new = np.clip(base - mean + col, 0, 255)
        n = cv2.GaussianBlur(self.rng.normal(0, 1, (self.H, self.W)).astype(np.float32), (0, 0), 0.7) * 3.0 * grain
        new = np.clip(new + n[..., None], 0, 255).astype(np.uint8)
        full = m
        if only:
            g = cv2.cvtColor(self.B, cv2.COLOR_BGR2GRAY)
            thr, _ = cv2.threshold(g[m > 0].reshape(-1, 1), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            sel = (g > thr) if only == 'bright' else (g <= thr)
            m = cv2.dilate((sel & (m > 0)).astype(np.uint8) * 255, np.ones((5, 5), np.uint8)) & m
        self.blend(new, m, feather)
        self.reg(full, label)

    def copy(self, label, src, to, flip=False, shape='ell', mode='seamless', scale=1.0, feather=4.0, mixed=False, region=None):
        """Copy the src box so its centre lands on `to`. Covers an object with
        nearby background, or duplicates an object onto plain ground."""
        x0, y0, x1, y1 = self.box(src)
        patch = self.A[y0:y1, x0:x1].copy()
        if flip:
            patch = patch[:, ::-1].copy()
        if scale != 1.0:
            patch = cv2.resize(patch, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        ph, pw = patch.shape[:2]
        cx, cy = self.S(to[0]), self.S(to[1])
        cx = min(max(cx, pw // 2 + 2), self.W - pw // 2 - 3)
        cy = min(max(cy, ph // 2 + 2), self.H - ph // 2 - 3)
        pm = np.zeros((ph, pw), np.uint8)
        if shape == 'ell':
            cv2.ellipse(pm, (pw // 2, ph // 2), (pw // 2 - 2, ph // 2 - 2), 0, 0, 360, 255, -1)
        else:
            pm[2:-2, 2:-2] = 255
        tx, ty = cx - pw // 2, cy - ph // 2
        full = np.zeros((self.H, self.W), np.uint8)
        full[ty:ty + ph, tx:tx + pw] = pm
        if mode == 'seamless':
            self.B = cv2.seamlessClone(patch, self.B, pm, (tx + pw // 2, ty + ph // 2), cv2.MIXED_CLONE if mixed else cv2.NORMAL_CLONE)
        else:
            new = self.B.copy()
            new[ty:ty + ph, tx:tx + pw] = patch
            self.blend(new, full, feather)
        self.reg(self.shape_mask(region) if region else full, label)

    def flip(self, label, box, shape='rect', mode='hard', feather=3.0):
        x0, y0, x1, y1 = box
        self.copy(label, box, ((x0 + x1) / 2, (y0 + y1) / 2), flip=True, shape=shape, mode=mode, feather=feather)

    # -- outputs ------------------------------------------------------------
    def finish(self):
        A, B, W, H = self.A, self.B, self.W, self.H
        oh = round(H * OUT_W / W)
        od = os.path.join(HERE, 'out')
        a = cv2.resize(A, (OUT_W, oh), interpolation=cv2.INTER_AREA)
        b = cv2.resize(B, (OUT_W, oh), interpolation=cv2.INTER_AREA)
        cv2.imwrite(f'{od}/{self.bid}_a.jpg', a, [cv2.IMWRITE_JPEG_QUALITY, 82])
        cv2.imwrite(f'{od}/{self.bid}_b.jpg', b, [cv2.IMWRITE_JPEG_QUALITY, 82])
        # read back what a player will actually see and measure it
        a2, b2 = cv2.imread(f'{od}/{self.bid}_a.jpg'), cv2.imread(f'{od}/{self.bid}_b.jpg')
        d = np.abs(a2.astype(np.int16) - b2.astype(np.int16)).max(axis=2)
        ch = (d > 22).astype(np.uint8)
        yy, xx = np.mgrid[0:oh, 0:OUT_W]
        cover = np.zeros((oh, OUT_W), bool)
        warn = []
        for i, r in enumerate(self.regs):
            dx = xx / OUT_W - r['x']
            dy = (yy / oh - r['y']) * oh / OUT_W
            inside = (dx / (r['rx'] * 1.2)) ** 2 + (dy / (r['ry'] * 1.2)) ** 2 <= 1
            r['_in'] = (dx / r['rx']) ** 2 + (dy / r['ry']) ** 2 <= 1
            n = int(ch[inside].sum())
            strength = float(d[inside & (ch > 0)].mean()) if n else 0
            r['px'] = n
            r['strength'] = round(strength, 1)
            if n < 220:
                warn.append(f'#{i + 1} too faint or small ({n}px changed)')
            cover |= inside
        stray = int(ch[~cover].sum())
        if stray > 500:
            ys, xs = np.where((ch > 0) & ~cover)
            warn.append(f'{stray}px changed OUTSIDE every region, e.g. view ({xs[0] * VIEW // OUT_W},{ys[0] * VIEW // OUT_W})')
        for i in range(len(self.regs)):
            for j in range(i + 1, len(self.regs)):
                p, q = self.regs[i], self.regs[j]
                if int((p['_in'] & q['_in']).sum()) > 0:
                    warn.append(f'#{i + 1} and #{j + 1} overlap')
        # a coarse changed-cell grid the JS verifier re-checks against the key
        GW = 80
        GH = round(GW * oh / OUT_W)
        cells = cv2.resize(ch * 255, (GW, GH), interpolation=cv2.INTER_AREA) > 10
        rows = [''.join('1' if c else '0' for c in row) for row in cells]
        sha = lambda f: hashlib.sha256(open(f, 'rb').read()).hexdigest()
        meta = dict(id=self.bid, w=OUT_W, h=oh,
                    diffs=[dict(label=r['label'], x=round(r['x'], 4), y=round(r['y'], 4), rx=round(r['rx'], 4), ry=round(r['ry'], 4)) for r in self.regs],
                    sha_a=sha(f'{od}/{self.bid}_a.jpg'), sha_b=sha(f'{od}/{self.bid}_b.jpg'), grid=rows,
                    stats=[dict(px=r['px'], strength=r['strength']) for r in self.regs], warn=warn)
        json.dump(meta, open(f'{od}/{self.bid}.json', 'w'), indent=0)
        # review sheet: A | B around every region
        tiles = []
        for i, r in enumerate(self.regs):
            cx, cy = int(r['x'] * W), int(r['y'] * H)
            s = int(max(max(r['rx'], r['ry']) * W * 1.5, 90 * self.k / 1.6))
            x0, y0 = max(0, cx - s), max(0, cy - s)
            x1, y1 = min(W, cx + s), min(H, cy + s)
            pa, pb = A[y0:y1, x0:x1], B[y0:y1, x0:x1]
            f = 300 / max(pa.shape[:2])
            pa, pb = [cv2.resize(p, None, fx=f, fy=f, interpolation=cv2.INTER_CUBIC) for p in (pa, pb)]
            t = np.full((320, 620, 3), 255, np.uint8)
            t[18:18 + pa.shape[0], 4:4 + pa.shape[1]] = pa
            t[18:18 + pb.shape[0], 314:314 + pb.shape[1]] = pb
            cv2.putText(t, f"{i + 1} {r['label'][:60]}  [{r['px']}px s{r['strength']}]", (4, 13), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 1)
            tiles.append(t)
        while len(tiles) % 2:
            tiles.append(np.full((320, 620, 3), 255, np.uint8))
        sheet = np.vstack([np.hstack(tiles[i:i + 2]) for i in range(0, len(tiles), 2)])
        cv2.imwrite(f'{od}/{self.bid}_review.jpg', sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])
        # whole pair, small, with rings on B
        ov = cv2.resize(B, (VIEW, round(H * VIEW / W)))
        for i, r in enumerate(self.regs):
            c = (int(r['x'] * VIEW), int(r['y'] * ov.shape[0]))
            cv2.ellipse(ov, c, (int(r['rx'] * VIEW), int(r['ry'] * VIEW)), 0, 0, 360, (255, 255, 255), 2)
            cv2.putText(ov, str(i + 1), (c[0] + 6, c[1] - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 4)
            cv2.putText(ov, str(i + 1), (c[0] + 6, c[1] - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.imwrite(f'{od}/{self.bid}_over.jpg', ov, [cv2.IMWRITE_JPEG_QUALITY, 80])
        print(self.bid, 'diffs', len(self.regs), 'bytes', os.path.getsize(f'{od}/{self.bid}_a.jpg'), os.path.getsize(f'{od}/{self.bid}_b.jpg'))
        for i, r in enumerate(self.regs):
            print(f"  {i + 1}. {r['label']}  ({r['x'] * VIEW:.0f},{r['y'] * VIEW * H / W:.0f}) r={r['rx'] * VIEW:.0f}x{r['ry'] * VIEW:.0f}  {r['px']}px s{r['strength']}")
        for w in warn:
            print('  WARN', w)
        return meta


if __name__ == '__main__':
    sys.path.insert(0, HERE)
    from boards import BOARDS
    cmd, bid = sys.argv[1], sys.argv[2]
    spec = BOARDS[bid]
    if cmd == 'grid':
        crop = [int(v) for v in sys.argv[3].split(',')] if len(sys.argv) > 3 else None
        zoom = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
        print(grid(bid, spec['src'], crop, zoom))
    else:
        b = Board(bid, spec['src'])
        for op in spec['ops']:
            kind, args = op[0], op[1]
            getattr(b, kind)(**args)
        b.finish()
