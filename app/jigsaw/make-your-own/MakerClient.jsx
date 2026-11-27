'use client';

// THE PHOTO JIGSAW MAKER (YOUR PHOTO JIGSAWS, owner 2026-11-27; "Make Your Puzzle" and "Your
// Puzzle Is Ready" on the "Your Photo Jigsaws Mockup" canvas). Pick a photo, frame it, name it,
// pick a size, choose who can play, then get the private link to send.
//
// The browser does the image work: the photo is drawn onto a canvas at most 3840 on its long
// side and re-encoded as JPEG, which also drops the camera's EXIF data (GPS included), plus a
// 960 wide copy. Both go straight to Storage through signed upload URLs from /api/photo-puzzles.

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { savedIdentity } from '@/lib/saved-identity';
import { JIGSAW_SIZES, sizeLabel } from '@/lib/jigsaw-sizes';
import { FULL_MAX, SMALL_W, MIN_LONG, MAX_BYTES, MINE_KEY, maxPiecesFor, cleanText } from '@/lib/photo-puzzle-shared';

const SHAPES = [['photo', 'As Taken', 0], ['wide', 'Wide', 4 / 3], ['square', 'Square', 1], ['tall', 'Tall', 3 / 4]];
const BUCKET = 'photo-puzzles';

function cropRect(iw, ih, ratio) {
  if (!ratio) return { x: 0, y: 0, w: iw, h: ih };
  if (iw / ih > ratio) { const w = Math.round(ih * ratio); return { x: Math.round((iw - w) / 2), y: 0, w, h: ih }; }
  const h = Math.round(iw / ratio); return { x: 0, y: Math.round((ih - h) / 2), w: iw, h };
}
function outSize(r) {
  const k = Math.min(1, FULL_MAX / Math.max(r.w, r.h));
  return { w: Math.round(r.w * k), h: Math.round(r.h * k) };
}
const toBlob = (c, q) => new Promise((res) => c.toBlob((b) => res(b), 'image/jpeg', q));
async function render(img, r, w, h, q) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, w, h);
  return toBlob(c, q);
}
const readMine = () => { try { const a = JSON.parse(localStorage.getItem(MINE_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };

export default function MakerClient() {
  const fileRef = useRef(null);
  const [img, setImg] = useState(null);         // HTMLImageElement
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [shape, setShape] = useState('photo');
  const [name, setName] = useState('');
  const [by, setBy] = useState('');
  const [pieces, setPieces] = useState(150);
  // Owner, 2026-11-27 (later): "Just Me" is the default; sharing by link or publishing on
  // Community Photos are opt-in.
  const [share, setShare] = useState('me');
  const [reveal, setReveal] = useState(false);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);       // { code, name, pieces, share }
  const [copied, setCopied] = useState(false);

  useEffect(() => { const u = savedIdentity().username; if (u) setBy(u); }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const ratio = (SHAPES.find((s) => s[0] === shape) || SHAPES[0])[2];
  const rect = img ? cropRect(img.naturalWidth, img.naturalHeight, ratio) : null;
  const out = rect ? outSize(rect) : null;
  const max = out ? maxPiecesFor(out.w, out.h) : 0;
  const tooSmall = out && Math.max(out.w, out.h) < MIN_LONG;
  useEffect(() => { if (max && pieces > max) setPieces(max); }, [max, pieces]);

  function pick(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setErr('');
    if (!/^image\//.test(f.type || 'image/')) { setErr('That file is not a photo. Try a JPEG or PNG.'); return; }
    const u = URL.createObjectURL(f);
    const i = new Image();
    i.onload = () => {
      setImg(i); setUrl(u); setFileName(f.name || 'photo');
      if (!name) setName(cleanText(String(f.name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' '), 80).replace(/^(img|dsc|pxl|photo)\s*\d*$/i, ''));
    };
    i.onerror = () => { URL.revokeObjectURL(u); setErr('This photo could not be opened. Try a JPEG or PNG.'); };
    i.src = u;
  }

  async function make() {
    if (!img || busy) return;
    setErr('');
    if (!cleanText(name, 80)) { setErr('Give your puzzle a name.'); return; }
    if (!rights) { setErr('Please confirm you took the photo or have the right to share it.'); return; }
    if (tooSmall) { setErr(`This photo is too small. It needs to be at least ${MIN_LONG} pixels on its long side.`); return; }
    try {
      setBusy('Preparing your photo');
      let full = await render(img, rect, out.w, out.h, 0.88);
      if (full && full.size > MAX_BYTES) full = await render(img, rect, out.w, out.h, 0.75);
      const sh = Math.round(out.h * (SMALL_W / out.w));
      const small = await render(img, rect, Math.min(SMALL_W, out.w), Math.min(sh, out.h), 0.82);
      if (!full || !small) throw new Error('This photo could not be prepared. Try another one.');
      let anonId = '';
      try { anonId = localStorage.getItem('sot_quiz_anon') || ''; } catch (e) { anonId = ''; }
      setBusy('Uploading');
      const s = await fetch('/api/photo-puzzles', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'start', name, by, pieces, share, rights, w: out.w, h: out.h, anonId, email: savedIdentity().email || undefined }),
      }).then((r) => r.json());
      if (!s.ok) throw new Error(s.error || 'The upload could not start.');
      const st = supabase.storage.from(BUCKET);
      const u1 = await st.uploadToSignedUrl(s.uploads.full.path, s.uploads.full.token, full, { contentType: 'image/jpeg' });
      if (u1.error) throw new Error('The photo did not upload. Check your connection and try again.');
      const u2 = await st.uploadToSignedUrl(s.uploads.small.path, s.uploads.small.token, small, { contentType: 'image/jpeg' });
      if (u2.error) throw new Error('The photo did not upload. Check your connection and try again.');
      setBusy('Cutting the pieces');
      const f = await fetch('/api/photo-puzzles', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'finish', code: s.code, token: s.token }),
      }).then((r) => r.json());
      if (!f.ok) throw new Error(f.error || 'The puzzle could not be made.');
      try {
        const mine = readMine().filter((x) => x.code !== s.code);
        mine.unshift({ code: s.code, token: s.token, name: cleanText(name, 80), at: new Date().toISOString() });
        localStorage.setItem(MINE_KEY, JSON.stringify(mine.slice(0, 60)));
      } catch (e) { /* storage full or blocked: the link still works */ }
      setDone({ code: s.code, name: cleanText(name, 80), pieces: s.pieces, share });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setErr(e && e.message ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy('');
    }
  }

  if (done) {
    const link = `${window.location.origin}/jigsaw/p/${done.code}`;
    const msg = `I made you a jigsaw puzzle: ${done.name}. ${link}`;
    const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) { setCopied(false); } };
    return (
      <section className="pz-card" aria-live="polite" id="maker">
        <span className="pz-eyb">Your Puzzle Is Ready</span>
        <h2 style={{ marginTop: 0 }}>{done.name}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img className="pz-pic" src={url} alt={done.name} style={{ maxHeight: 320 }} /> : null}
        {done.share === 'me' && !reveal ? (
          <>
            <p>Saved to Your Photos. It is private to you: nobody else can find it on Mind Loft or in search.</p>
            <button type="button" className="pz-btn ghost" style={{ marginBottom: 14 }} onClick={() => setReveal(true)}>Share a Private Link Instead</button>
          </>
        ) : (
          <>
          <div className="pz-link" style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '14px 0', padding: '10px 12px', border: '1px solid rgba(244,234,216,.3)', borderRadius: 12, background: '#16120e' }}>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>{link.replace(/^https?:\/\//, '')}</span>
            <button type="button" className="pz-btn" style={{ minHeight: 40, padding: '8px 16px' }} onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <div className="pz-row" style={{ margin: '0 0 14px' }}>
            <a className="pz-btn ghost" href={`sms:?&body=${encodeURIComponent(msg)}`}>Text</a>
            <a className="pz-btn ghost" href={`mailto:?subject=${encodeURIComponent(`A jigsaw puzzle for you: ${done.name}`)}&body=${encodeURIComponent(msg)}`}>Email</a>
            {typeof navigator !== 'undefined' && navigator.share ? <button type="button" className="pz-btn ghost" onClick={() => navigator.share({ title: done.name, text: `I made you a jigsaw puzzle: ${done.name}`, url: link }).catch(() => {})}>More</button> : null}
          </div>
          <p className="pz-note">Only people with this link can play. Search engines are told not to show it. You can turn the link off any time from Your Photos on the Jigsaw Puzzles page.</p>
          </>
        )}
        {done.share === 'community' ? <p className="pz-note">You published it to Community Photos. It shows there once Mind Loft has reviewed it.</p> : null}
        <div className="pz-row">
          <a className="pz-btn" href={`/jigsaw/p/${done.code}?pieces=${done.pieces}`}>Play It Now</a>
          <a className="pz-btn ghost" href="/jig/shelf?tab=yours">Go to Your Photos</a>
          <button type="button" className="pz-btn ghost" onClick={() => { setDone(null); setImg(null); setUrl(''); setName(''); setRights(false); setShare('me'); setReveal(false); }}>Make Another</button>
        </div>
      </section>
    );
  }

  return (
    <section className="pz-card" id="maker" aria-label="Make your puzzle">
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} id="pz-file" />
      {!img ? (
        <div style={{ textAlign: 'center', padding: '22px 8px' }}>
          <p style={{ fontWeight: 700, color: '#f4ead8' }}>Choose a photo from your phone or computer.</p>
          <button type="button" className="pz-btn" onClick={() => fileRef.current && fileRef.current.click()}>Upload a Photo</button>
          {err ? <p role="alert" style={{ color: '#ffb4a8', marginTop: 12 }}>{err}</p> : null}
          <p className="pz-note" style={{ marginTop: 12 }}>JPEG or PNG, at least {MIN_LONG} pixels on the long side. Location data is removed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(244,234,216,.16)', background: '#16120e', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 640, aspectRatio: `${rect.w} / ${rect.h}`, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Your photo" style={{ position: 'absolute', width: `${(img.naturalWidth / rect.w) * 100}%`, left: `${(-rect.x / rect.w) * 100}%`, top: `${(-rect.y / rect.h) * 100}%`, maxWidth: 'none' }} />
            </div>
          </div>
          <p className="pz-note" style={{ margin: 0 }}>{fileName} · {out.w} x {out.h} · supports up to {sizeLabel(max)} pieces
            {' '}<button type="button" onClick={() => fileRef.current && fileRef.current.click()} style={{ background: 'none', border: 0, color: '#f3d98b', fontWeight: 700, cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}>Change Photo</button></p>

          <div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }} id="pz-shape">Shape</div>
            <div className="pz-sizes" role="group" aria-labelledby="pz-shape" style={{ gridTemplateColumns: 'repeat(4,minmax(0,1fr))' }}>
              {SHAPES.map(([k, lab]) => <a key={k} href="#maker" className={shape === k ? 'on' : ''} aria-pressed={shape === k} onClick={(e) => { e.preventDefault(); setShape(k); }}>{lab}</a>)}
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 800, fontSize: 14 }}>
            Puzzle Name
            <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Biscuit at the Beach" style={{ background: '#16120e', border: '1px solid rgba(244,234,216,.3)', borderRadius: 10, color: '#f4ead8', fontSize: 16, padding: '11px 12px', fontFamily: 'inherit' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 800, fontSize: 14 }}>
            Your Name <span style={{ fontWeight: 600, fontSize: 12, color: 'rgba(244,234,216,.6)' }}>Shown as who made the puzzle. Optional.</span>
            <input value={by} maxLength={40} onChange={(e) => setBy(e.target.value)} placeholder="Grandma Jo" style={{ background: '#16120e', border: '1px solid rgba(244,234,216,.3)', borderRadius: 10, color: '#f4ead8', fontSize: 16, padding: '11px 12px', fontFamily: 'inherit' }} />
          </label>

          <div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }} id="pz-pc">Pieces <span style={{ fontWeight: 600, fontSize: 12, color: 'rgba(244,234,216,.6)' }}>Anyone you share it with can change this.</span></div>
            <div className="pz-sizes" role="group" aria-labelledby="pz-pc">
              {JIGSAW_SIZES.map((s) => (s <= max
                ? <a key={s} href="#maker" className={pieces === s ? 'on' : ''} aria-pressed={pieces === s} onClick={(e) => { e.preventDefault(); setPieces(s); }}>{sizeLabel(s)}</a>
                : <span key={s} aria-disabled="true">{sizeLabel(s)}</span>))}
            </div>
          </div>

          <div role="radiogroup" aria-label="Who can play" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Who Can Play</div>
            {[['me', 'Just Me', 'Private to you. It is saved in Your Photos on this device and never shown to anyone else.'],
              ['link', 'Me and People I Send the Link To', 'Get a private link to text or email to family and friends. Never shown in search.'],
              ['community', 'Publish on Community Photos', 'Everyone on Mind Loft can play it once Mind Loft has reviewed the photo. You also get a link right away.']].map(([k, t, d]) => (
              <button key={k} type="button" role="radio" aria-checked={share === k} onClick={() => setShare(k)}
                style={{ textAlign: 'left', background: share === k ? '#2b241c' : '#16120e', border: `1px solid ${share === k ? '#f3d98b' : 'rgba(244,234,216,.2)'}`, borderRadius: 12, padding: '12px 14px', color: '#f4ead8', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 800 }}>{t}</span>
                <span style={{ display: 'block', fontSize: 13, color: 'rgba(244,234,216,.72)', marginTop: 2 }}>{d}</span>
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'rgba(244,234,216,.82)', lineHeight: 1.45 }}>
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} style={{ width: 20, height: 20, margin: '1px 0 0', accentColor: '#f3d98b' }} />
            <span>I took this photo or have the right to share it{share === 'community' ? ', and anyone in it is OK with it being public' : ''}.</span>
          </label>

          {err ? <p role="alert" style={{ color: '#ffb4a8', margin: 0 }}>{err}</p> : null}
          <button type="button" className="pz-btn" onClick={make} disabled={!!busy} style={{ width: '100%' }}>{busy ? `${busy}...` : 'Make My Puzzle'}</button>
        </div>
      )}
    </section>
  );
}
