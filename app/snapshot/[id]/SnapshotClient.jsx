'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Copy, Link2, Check, Image as ImageIcon } from 'lucide-react';
import { LISTS } from '@/lib/data';
import { getSources, voteKey, dedupeByName } from '@/lib/helpers';
import { HERO_IMAGES } from '@/lib/hero-images';
import { fetchBootstrap } from '@/lib/api';
import { ListOverviewPoster } from '../../list/[id]/ListOverview';
import { withRef } from '@/lib/referrals';
import { T } from '@/lib/theme';

const POSTER_W = 1080;
const POSTER_H = 1350;

const COLOR_SCHEMES = {
  classic:    { label: 'Classic',    bg: '#f4ede0', text: '#1a1a1a', accent: T.danger, faded: '#8a7a6a', swatch: ['#f4ede0', T.danger] },
  midnight:   { label: 'Midnight',   bg: '#111118', text: '#f0eeea', accent: '#d4a944', faded: '#7070a0', swatch: ['#111118', '#d4a944'] },
  slate:      { label: 'Slate',      bg: '#1c2b3a', text: '#dce8f0', accent: '#4ea8de', faded: '#7090a8', swatch: ['#1c2b3a', '#4ea8de'] },
  forest:     { label: 'Forest',     bg: '#0e1e14', text: '#d8ead0', accent: '#6cbf5a', faded: '#5a8060', swatch: ['#0e1e14', '#6cbf5a'] },
  crimson:    { label: 'Crimson',    bg: '#b82c20', text: '#fdf4ec', accent: '#f5e050', faded: '#e8a090', swatch: ['#b82c20', '#f5e050'] },
  neon:       { label: 'Neon',       bg: '#000000', text: T.white, accent: '#00ff88', faded: '#666666', swatch: ['#000000', '#00ff88'] },
  cobalt:     { label: 'Cobalt',     bg: '#1244c5', text: T.accentSoft, accent: '#ffde59', faded: '#8aaae0', swatch: ['#1244c5', '#ffde59'] },
  tangerine:  { label: 'Tangerine',  bg: '#e84800', text: '#fff8f0', accent: '#ffe066', faded: '#f0a070', swatch: ['#e84800', '#ffe066'] },
  violet:     { label: 'Violet',     bg: '#3a0f88', text: '#ead4ff', accent: '#9dff6e', faded: '#9060c0', swatch: ['#3a0f88', '#9dff6e'] },
  rose:       { label: 'Rose',       bg: '#c2105a', text: '#fff0f5', accent: '#ffe066', faded: '#e880a8', swatch: ['#c2105a', '#ffe066'] },
  sand:       { label: 'Sand',       bg: '#e8d49a', text: '#2a1a06', accent: '#7a3800', faded: '#9a7a40', swatch: ['#e8d49a', '#7a3800'] },
  espresso:   { label: 'Espresso',   bg: '#1a0d06', text: '#f0e8d8', accent: '#d4a060', faded: '#806040', swatch: ['#1a0d06', '#d4a060'] },
  sage:       { label: 'Sage',       bg: '#c8dcc0', text: '#1a2a15', accent: '#2a6020', faded: '#5a7852', swatch: ['#c8dcc0', '#2a6020'] },
  toxic:      { label: 'Toxic',      bg: '#0a0a0a', text: '#e8ff00', accent: '#ff00aa', faded: '#4a4a00', swatch: ['#0a0a0a', '#e8ff00'] },
  ocean:      { label: 'Ocean',      bg: '#001f3f', text: '#e0f4ff', accent: '#00d4ff', faded: '#305070', swatch: ['#001f3f', '#00d4ff'] },
  bubblegum:  { label: 'Bubblegum', bg: '#ff6eb4', text: '#1a0010', accent: T.white, faded: '#cc3088', swatch: ['#ff6eb4', T.white] },
  lemon:      { label: 'Lemon',      bg: '#f7e900', text: '#1a1400', accent: '#ff2200', faded: '#8a8000', swatch: ['#f7e900', '#ff2200'] },
  denim:      { label: 'Denim',      bg: '#1b3a6b', text: '#f0f4ff', accent: '#ff7f00', faded: '#6080b0', swatch: ['#1b3a6b', '#ff7f00'] },
  aurora:     { label: 'Aurora',     bg: '#0d0d2b', text: '#e8f0ff', accent: '#ff4fd8', faded: '#4040a0', swatch: ['#0d0d2b', '#ff4fd8'] },
  matcha:     { label: 'Matcha',     bg: '#2d4a1e', text: '#f0f7e8', accent: '#c8f060', faded: '#5a7848', swatch: ['#2d4a1e', '#c8f060'] },
  candy:      { label: 'Candy',      bg: T.white, text: '#cc0022', accent: '#cc0022', faded: '#ff6688', swatch: [T.white, '#cc0022'] },
  ink:        { label: 'Ink',        bg: '#0a0a0a', text: T.white, accent: T.white, faded: '#555555', swatch: ['#0a0a0a', T.white] },
  copper:     { label: 'Copper',     bg: '#3d1800', text: '#ffe8cc', accent: '#ff8c00', faded: '#804020', swatch: ['#3d1800', '#ff8c00'] },
};

// Every style here is a full-bleed layout whose rows STRETCH to fill the
// poster height (the thing that made Scorecard good). `photos: true` marks the
// two layouts that pull in the top-3 hero images from lib/hero-images.js.
const FONT_STYLES = {
  scorecard: {
    label: 'Scorecard',
    previewFont: 'Manrope, sans-serif', previewStyle: 'normal', previewWeight: 700,
  },
  ledger: {
    label: 'Ledger',
    previewFont: 'Manrope, system-ui, -apple-system, sans-serif', previewStyle: 'italic', previewWeight: 700,
  },
  stack: {
    label: 'Stack',
    previewFont: 'Manrope, sans-serif', previewStyle: 'normal', previewWeight: 900,
  },
  chart: {
    label: 'Chart',
    previewFont: 'Manrope, sans-serif', previewStyle: 'normal', previewWeight: 800,
  },
  spotlight: {
    label: 'Spotlight',
    previewFont: 'Manrope, sans-serif', previewStyle: 'normal', previewWeight: 800,
    photos: true,
  },
  showcase: {
    label: 'Showcase',
    previewFont: 'Manrope, sans-serif', previewStyle: 'normal', previewWeight: 700,
    photos: true,
  },
};

function sourceTier(src) {
  const id = (src.id || '').toLowerCase();
  const l = (src.label || '').toLowerCase();
  if (src.trueExpert) return 0;
  if (id === 'pricing' || l.includes('pricing') || l.includes('nightly rate')) return 4;
  const platform = ['yelp','google','tripadvisor','trip advisor','booking','expedia','hotels.com','opentable','amazon'].some((h) => id.includes(h.replace(/[^a-z]/g,'')) || l.includes(h));
  if (platform) return 3;
  const premium = ['michelin','infatuation','cond','leisure','cntraveler','robb report','forbes','us news','u.s. news','new york times','nyt'];
  if (premium.some((k) => l.includes(k))) return 1;
  return 2;
}

function constituentLabel(src) {
  const id = (src.id || '').toLowerCase();
  const raw = src.label || '';
  const l = raw.toLowerCase();
  if (id === 'pricing' || l.includes('pricing') || l.includes('nightly rate')) return 'Pricing';
  if (id.includes('yelp') || l.includes('yelp')) return 'Yelp';
  if (id.includes('google') || l.includes('google')) return 'Google';
  if (l.includes('tripadvisor') || l.includes('trip advisor')) return 'Tripadvisor';
  if (l.includes('booking.com')) return 'Booking';
  if (l.includes('amazon')) return 'Amazon';
  const MAP = [
    ['michelin','Michelin'],['infatuation','Infatuation'],['eater','Eater'],
    ['time out','Time Out'],['timeout','Time Out'],['u.s. news','US News'],['us news','US News'],
    ['condé nast','Condé Nast'],['conde nast','Condé Nast'],['cntraveler','Condé Nast'],
    ['travel + leisure','T+L'],['travel and leisure','T+L'],['robb report','Robb Report'],
    ['forbes','Forbes'],['points guy','Points Guy'],['afar','AFAR'],
    ['wirecutter','Wirecutter'],['good housekeeping','Good Housekeeping'],['cnet','CNET'],
    ['serious eats','Serious Eats'],['thrillist','Thrillist'],['new york times','NYT'],
    ['bon app','Bon Appétit'],['esquire','Esquire'],
    ['johnny novo','Johnny Novo'],['johnnynovo','Johnny Novo'],
    ['the strategist','Strategist'],['rolling stone','Rolling Stone'],['pitchfork','Pitchfork'],
  ];
  for (let i = 0; i < MAP.length; i++) { if (l.includes(MAP[i][0])) return MAP[i][1]; }
  let s = raw.split(/[·—|:(,]/)[0];
  s = s.replace(/\b(19|20)\d\d\b/g,'').replace(/\s{2,}/g,' ').trim();
  const CAP = 22;
  if (s.length > CAP) { const cut = s.slice(0,CAP); const sp = cut.lastIndexOf(' '); if (sp > 6) s = cut.slice(0,sp).trim(); }
  return s || raw;
}

// `embedded` renders the share UI as the Share tab of the list page: the
// parent (DetailClient) supplies list/voteData/extras so no fetch happens
// here, and the page chrome (back button, heading, full-page wrapper) is
// skipped. The standalone /snapshot/[id] page keeps working unchanged.
export default function SnapshotClient({ listId, embedded, list: listProp, voteData: voteDataProp, extras: extrasProp }) {
  const router = useRouter();
  const [voteDataState, setVoteDataState] = useState({});
  const [extrasState, setExtrasState] = useState([]);
  const [userLists, setUserLists] = useState([]);
  const [loaded, setLoaded] = useState(!!embedded);
  const [mode, setMode] = useState('ai');
  const [modeInit, setModeInit] = useState(false);
  const [copied, setCopied] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [renderBusy, setRenderBusy] = useState('');
  const [imgBusy, setImgBusy] = useState(false);
  const [colorScheme, setColorScheme] = useState('classic');
  const [fontStyle, setFontStyle] = useState('scorecard');
  const posterRef = useRef(null);
  const pageRef = useRef(null);
  const socialRef = useRef(null);
  const top3Ref = useRef(null);

  useEffect(() => {
    if (embedded) return; // embedded: the parent supplies live data
    fetchBootstrap().then((data) => {
      if (data) {
        setVoteDataState(data.votes || {});
        setExtrasState((data.extras || {})[listId] || []);
        setUserLists(Array.isArray(data.userLists) ? data.userLists : []);
      }
      setLoaded(true);
    });
  }, [listId, embedded]);

  const voteData = embedded ? (voteDataProp || {}) : voteDataState;
  const extras = embedded ? (extrasProp || []) : extrasState;

  const list = useMemo(() => listProp || [...userLists, ...LISTS].find((l) => l.id === listId), [listProp, userLists, listId]);

  const sources = useMemo(() => {
    if (!list) return [];
    if (list.mode === 'facts' || list.mode === 'unranked') {
      const aiItems = list.sources?.ai?.items || [];
      if (aiItems.length > 0) return [{ id: 'ai', label: list.sources?.ai?.label || 'Consensus Seed', items: aiItems }];
      return [];
    }
    if (list.mode === 'scores') {
      const aiItems = list.sources?.ai?.items || [];
      const publications = Object.entries(list.sources || {}).filter(([id]) => id !== 'ai').map(([id, src]) => ({ id, label: src.label, items: src.items, url: src.url }));
      const out = aiItems.length > 0 ? [{ id: 'ai', label: list.sources?.ai?.label || 'Consensus Seed', items: aiItems }] : [];
      if (publications.length <= 1) return out.length > 0 ? out : publications;
      return [...out, ...publications];
    }
    return getSources(list, voteData, extras);
  }, [list, voteData, extras]);

  const items = useMemo(() => {
    if (!list) return [];
    if (mode === 'vote') {
      const listMode = list.mode || 'both';
      const universeItems = [...(list.vote?.items || [])];
      if (listMode === 'both') {
        getSources(list, voteData, extras).forEach((source) => {
          if (source.id === 'consensus') return;
          source.items.forEach((item) => {
            if (!universeItems.some((i) => i.toLowerCase().trim() === item.toLowerCase().trim())) universeItems.push(item);
          });
        });
      }
      const all = dedupeByName([...universeItems, ...extras]);
      const scored = all.map((item, idx) => ({ item, score: voteData[voteKey(list.id, item)] || 0, idx }));
      scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
      return scored.slice(0, 10).map((s) => s.item);
    }
    const src = sources.find((s) => s.id === mode) || sources[0];
    return (src?.items || []).slice(0, 10);
  }, [list, mode, sources, voteData, extras]);

  const modeLabel = useMemo(() => {
    if (mode === 'vote') return 'Source of Truths User Vote';
    if (mode === 'consensus') return 'Consensus';
    const src = sources.find((s) => s.id === mode);
    return src?.label || 'Ranked';
  }, [mode, sources]);

  const constituentSourceNames = useMemo(() => {
    if (!list) return [];
    const ordered = sources.filter((s) => s.id !== 'consensus' && s.id !== 'ai').map((s, i) => ({ s, i, t: sourceTier(s) })).sort((a, b) => a.t - b.t || a.i - b.i);
    return dedupeByName(ordered.map((x) => constituentLabel(x.s)));
  }, [sources, list]);

  useEffect(() => {
    if (modeInit || sources.length === 0) return;
    const hasConsensus = sources.some((s) => s.id === 'consensus');
    setMode(hasConsensus ? 'consensus' : (sources[0]?.id || 'ai'));
    setModeInit(true);
  }, [sources, modeInit]);

  const palette = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.classic;

  async function downloadPoster() {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio: 2, width: POSTER_W, height: POSTER_H, backgroundColor: palette.bg });
      const link = document.createElement('a');
      link.download = `source-of-truths-${list.id}-${mode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Download failed', e);
      alert('Could not generate image. Try a different browser or take a screenshot instead.');
    }
    setDownloading(false);
  }

  // Download a list-page render (full or Top 3). Width is fixed at 1080;
  // height follows the content. When cropH is given, the output is a
  // top-anchored crop at that height, so the masthead, title, and first hero
  // tiles are what survive.
  async function downloadRender(ref, suffix, cropH) {
    if (!ref.current || renderBusy) return;
    setRenderBusy(suffix);
    try {
      const { toCanvas } = await import('html-to-image');
      const node = ref.current;
      const full = await toCanvas(node, { cacheBust: true, pixelRatio: 2, width: 1080, height: node.offsetHeight, backgroundColor: '#f4ede0' });
      let out = full;
      if (cropH) {
        out = document.createElement('canvas');
        out.width = 1080 * 2;
        out.height = cropH * 2;
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#f4ede0';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(full, 0, 0);
      }
      const link = document.createElement('a');
      link.download = `source-of-truths-${list.id}-${suffix}.png`;
      link.href = out.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed', e);
      alert('Could not generate image. Try a different browser or take a screenshot instead.');
    }
    setRenderBusy('');
  }

  function copyLink() {
    const url = withRef(`${window.location.origin}/list/${encodeURIComponent(listId)}`);
    navigator.clipboard.writeText(url).then(() => { setCopied('link'); setTimeout(() => setCopied(''), 1800); });
  }

  function copyText() {
    if (!list) return;
    const lines = [list.title, `— ${modeLabel} —`, ''];
    items.forEach((item, i) => { lines.push(`${String(i + 1)}. ${item}`); });
    lines.push('', withRef(`mindloftdaily.com/list/${list.id}`));
    navigator.clipboard.writeText(lines.join('\n')).then(() => { setCopied('text'); setTimeout(() => setCopied(''), 1800); });
  }

  function posterImageUrl() {
    return `${window.location.origin}/list/${encodeURIComponent(listId)}/poster-image`;
  }

  // Copy the direct link to the server-rendered Instagram poster PNG.
  function copyImageLink() {
    navigator.clipboard.writeText(posterImageUrl()).then(() => { setCopied('imglink'); setTimeout(() => setCopied(''), 1800); });
  }

  // Copy the actual Instagram poster PNG (/list/<id>/poster-image) to the
  // clipboard. Falls back to copying the link, then to opening the image.
  async function copyImage() {
    if (imgBusy) return;
    setImgBusy(true);
    try {
      const res = await fetch(posterImageUrl(), { cache: 'no-store' });
      const blob = await res.blob();
      await navigator.clipboard.write([new window.ClipboardItem({ [blob.type || 'image/png']: blob })]);
      setCopied('img'); setTimeout(() => setCopied(''), 1800);
    } catch (e) {
      console.error('Copy image failed', e);
      try {
        await navigator.clipboard.writeText(posterImageUrl());
        setCopied('imglink'); setTimeout(() => setCopied(''), 1800);
      } catch (_) {
        window.open(posterImageUrl(), '_blank', 'noopener,noreferrer');
      }
    }
    setImgBusy(false);
  }

  if (!loaded) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 18, color: T.slate }}>loading</div>;
  }

  if (!list) {
    return (
      <div style={{ padding: 48, textAlign: 'center', background: T.surface, minHeight: '100vh' }}>
        <p style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', color: T.slate }}>That list seems to have wandered off.</p>
        <button onClick={() => router.push('/')} style={{ marginTop: 16, background: T.ink, color: T.surface, border: 'none', padding: '10px 20px', fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}>Back home</button>
      </div>
    );
  }

  const modeOptions = [];
  const ai = sources.find((s) => s.id === 'ai');
  if (ai) modeOptions.push({ id: 'ai', label: ai.label });
  const cons = sources.find((s) => s.id === 'consensus');
  if (cons) modeOptions.push({ id: 'consensus', label: 'Consensus' });
  sources.filter((s) => s.id !== 'ai' && s.id !== 'consensus').map((s, i) => ({ s, i, t: sourceTier(s) })).sort((a, b) => a.t - b.t || a.i - b.i).forEach((x) => modeOptions.push({ id: x.s.id, label: x.s.label }));
  if (list.mode !== 'facts' && list.mode !== 'scores' && list.mode !== 'unranked') modeOptions.push({ id: 'vote', label: 'Source of Truths User Vote' });

  return (
    <div style={embedded ? undefined : { minHeight: '100vh', background: T.surface, color: T.ink, padding: '24px 16px 64px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {!embedded && (
          <button onClick={() => router.push(`/list/${encodeURIComponent(listId)}`)}
            style={{ background: 'transparent', border: 'none', fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', marginBottom: 12 }}>
            <ArrowLeft size={14} strokeWidth={2.5} />Back to list
          </button>
        )}

        <h2 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontStyle: 'italic', fontSize: 24, margin: '0 0 18px', color: T.ink, fontVariationSettings: '"SOFT" 100' }}>Share this list</h2>

        <>
        {!embedded && (
        <PickerRow label="Source">
          {modeOptions.map((opt) => {
            const active = mode === opt.id;
            return <button key={opt.id} onClick={() => setMode(opt.id)} style={{ background: active ? T.ink : 'transparent', color: active ? T.surface : T.ink, border: `1.5px solid ${T.ink}`, padding: '6px 12px', fontFamily: 'Manrope, monospace', fontSize: 10, lineHeight: 1.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', maxWidth: '100%', textAlign: 'left' }}>{opt.label}</button>;
          })}
        </PickerRow>
        )}

        <PickerRow label="Color">
          {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => {
            const active = colorScheme === key;
            return (
              <button key={key} onClick={() => setColorScheme(key)} title={scheme.label}
                style={{ background: active ? T.ink : 'transparent', color: active ? T.surface : T.ink, border: `1.5px solid ${active ? T.ink : '#c8bdb0'}`, padding: '5px 10px', fontFamily: 'Manrope, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ display: 'inline-flex', width: 20, height: 14, borderRadius: 2, overflow: 'hidden', border: active ? `1px solid ${T.surface}` : '1px solid #c8bdb0', flexShrink: 0 }}>
                  <span style={{ background: scheme.swatch[0], flex: 1 }} /><span style={{ background: scheme.swatch[1], flex: 1 }} />
                </span>
                {scheme.label}
              </button>
            );
          })}
        </PickerRow>

        <PickerRow label="Style">
          {Object.entries(FONT_STYLES).map(([key, fs]) => {
            const active = fontStyle === key;
            return (
              <button key={key} onClick={() => setFontStyle(key)}
                style={{ background: active ? T.ink : 'transparent', color: active ? T.surface : T.ink, border: `1.5px solid ${active ? T.ink : '#c8bdb0'}`, padding: '6px 14px', fontFamily: fs.previewFont, fontStyle: fs.previewStyle, fontWeight: fs.previewWeight, fontSize: 12, cursor: 'pointer', letterSpacing: key === 'bold' ? '0.08em' : '0.01em', textTransform: key === 'bold' ? 'uppercase' : 'none' }}>
                {fs.label}
              </button>
            );
          })}
        </PickerRow>
        <p style={{ fontFamily: 'Manrope, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.slate, margin: '-6px 0 14px' }}>
          Spotlight &amp; Showcase use the top-3 photos when the list has them.
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, marginTop: 4 }}>
          <ActionButton onClick={downloadPoster} disabled={downloading} primary><Download size={14} strokeWidth={2.5} />{downloading ? 'Generating...' : 'Download poster'}</ActionButton>
          <ActionButton onClick={copyLink}>{copied === 'link' ? <Check size={14} strokeWidth={2.5} /> : <Link2 size={14} strokeWidth={2.5} />}{copied === 'link' ? 'Copied' : 'Copy link'}</ActionButton>
          <ActionButton onClick={copyText}>{copied === 'text' ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2.5} />}{copied === 'text' ? 'Copied' : 'Copy as text'}</ActionButton>
        </div>

        <div style={{ background: '#000', padding: 8, borderRadius: 4, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <PosterScaler>
            <Poster ref={posterRef} list={list} items={items} modeLabel={modeLabel} sourceNames={constituentSourceNames} palette={palette} fontStyle={fontStyle} />
          </PosterScaler>
        </div>

        <p style={{ marginTop: 20, fontFamily: 'Manrope, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.slate, textAlign: 'center' }}>
          1080 × 1350 · Instagram / Pinterest portrait
        </p>
        </>

        {/* ─── Instagram automation image (server-rendered poster) ────── */}
        <div style={{ marginTop: 52, borderTop: `2px solid ${T.ink}`, paddingTop: 28 }}>
          <h2 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 700, fontStyle: 'italic', fontSize: 24, margin: '0 0 6px', color: T.ink, fontVariationSettings: '"SOFT" 100' }}>Instagram image</h2>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: T.slate, margin: '0 0 16px', maxWidth: 560 }}>
            The ready-to-post 1080 × 1350 image the Instagram automation uses. Copy the image itself, or a direct link to it, to share anywhere.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            <ActionButton onClick={copyImage} disabled={imgBusy} primary><ImageIcon size={14} strokeWidth={2.5} />{imgBusy ? 'Copying...' : copied === 'img' ? 'Copied' : 'Copy image'}</ActionButton>
            <ActionButton onClick={copyImageLink}>{copied === 'imglink' ? <Check size={14} strokeWidth={2.5} /> : <Link2 size={14} strokeWidth={2.5} />}{copied === 'imglink' ? 'Copied' : 'Copy image link'}</ActionButton>
          </div>
          <div style={{ background: '#000', padding: 8, borderRadius: 4, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/list/${encodeURIComponent(listId)}/poster-image`} alt="Instagram poster" loading="lazy" style={{ width: '100%', maxWidth: POSTER_W * 0.5, height: 'auto', display: 'block' }} />
          </div>
          <p style={{ marginTop: 20, fontFamily: 'Manrope, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.slate, textAlign: 'center' }}>
            1080 × 1350 · server-rendered · /list/{list.id}/poster-image
          </p>
        </div>

      </div>
    </div>
  );
}

function PickerRow({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'Manrope, monospace', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.slate, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

function ActionButton({ onClick, children, disabled, primary }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: primary ? T.ink : 'transparent', color: primary ? T.surface : T.ink, border: `1.5px solid ${T.ink}`, padding: '10px 16px', fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, cursor: disabled ? 'wait' : 'pointer', boxShadow: primary ? `3px 3px 0 ${T.accent}` : 'none', display: 'flex', alignItems: 'center', gap: 8, opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );
}

function PosterScaler({ children }) {
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    function updateScale() { const available = Math.min(window.innerWidth - 60, 720); setScale(available / POSTER_W); }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  return (
    <div style={{ width: POSTER_W * scale, height: POSTER_H * scale, position: 'relative', overflow: 'hidden' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: POSTER_W, height: POSTER_H, position: 'absolute', top: 0, left: 0 }}>{children}</div>
    </div>
  );
}

// Like PosterScaler, but the content height follows the rendered list page
// (variable, not the fixed 1350 poster height), so it's observed live.
function PageScaler({ children, innerRef }) {
  const [scale, setScale] = useState(0.5);
  const [contentH, setContentH] = useState(1350);
  useEffect(() => {
    function updateScale() { const available = Math.min(window.innerWidth - 60, 720); setScale(available / POSTER_W); }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  useEffect(() => {
    const node = innerRef?.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { if (innerRef.current) setContentH(innerRef.current.offsetHeight); });
    ro.observe(node);
    setContentH(node.offsetHeight);
    return () => ro.disconnect();
  }, [innerRef]);
  return (
    <div style={{ width: POSTER_W * scale, height: contentH * scale, position: 'relative', overflow: 'hidden' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: POSTER_W, position: 'absolute', top: 0, left: 0 }}>{children}</div>
    </div>
  );
}

// Scale a layout's base title size down for long titles, so a three- or
// four-line headline doesn't push the list into the footer.
function fitTitle(title, base) {
  const n = (title || '').length;
  if (n > 64) return Math.round(base * 0.58);
  if (n > 44) return Math.round(base * 0.72);
  if (n > 30) return Math.round(base * 0.86);
  return base;
}

/* ─── Hero photo helpers (top-3 images for the photo layouts) ───────────── */
function heroSrcFor(list, item) {
  const entry = item ? (HERO_IMAGES[list.id] || {})[item] : null;
  if (!entry) return null;
  return typeof entry === 'string' ? entry : entry.src;
}

// Route the remote photo through the site's own optimizer so html-to-image can
// inline it same-origin (a raw remote URL would taint the canvas and blank the
// downloaded PNG). Renders nothing when the list has no photo for the item.
function PosterImg({ src, alt }) {
  if (!src) return null;
  const optimized = `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`;
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={optimized} alt={alt || ''} loading="eager" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />;
}

/* ─── LAYOUT: Ledger (serif editorial, full-height rows) ────────────────── */
function PosterLedger({ list, items, modeLabel, sourceNames, pal }) {
  return (
    <div style={{ width: POSTER_W, height: POSTER_H, background: pal.bg, color: pal.text, boxSizing: 'border-box', fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '48px 64px 22px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: 'Manrope, monospace', fontSize: 13, letterSpacing: '0.28em', textTransform: 'uppercase', color: pal.faded, marginBottom: 18 }}>
          <span style={{ color: pal.accent, fontWeight: 600 }}>Mind Loft</span>
          <span>{list.category} &middot; Top {Math.min(items.length, 10)}</span>
        </div>
        <h1 style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: fitTitle(list.title, 64), lineHeight: 0.95, letterSpacing: '-0.03em', margin: 0, color: pal.text, fontVariationSettings: '"SOFT" 100, "WONK" 1', maxWidth: '94%' }}>
          {list.title}
        </h1>
        <div style={{ marginTop: 12, fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontSize: 22, color: pal.faded, fontVariationSettings: '"SOFT" 100' }}>{modeLabel}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: `2px solid ${pal.text}` }}>
        {items.map((item, i) => {
          const isTop = i === 0;
          const top3 = i < 3;
          return (
            <div key={i} style={{ flex: isTop ? 1.5 : 1, display: 'flex', alignItems: 'center', gap: 28, padding: '0 64px', background: isTop ? `rgba(${hexToRgb(pal.accent)},0.10)` : 'transparent', borderBottom: i < items.length - 1 ? `1px solid rgba(${hexToRgb(pal.text)},0.15)` : 'none' }}>
              <span style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontStyle: 'italic', fontWeight: 900, fontSize: isTop ? 72 : top3 ? 46 : 38, color: top3 ? pal.accent : pal.faded, minWidth: 94, flexShrink: 0, lineHeight: 0.85, fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>{i + 1}</span>
              <span style={{ fontFamily: 'Manrope, system-ui, -apple-system, sans-serif', fontWeight: isTop ? 700 : 500, fontStyle: isTop ? 'normal' : 'italic', fontSize: isTop ? 44 : 29, color: pal.text, lineHeight: 1.04, flex: 1, letterSpacing: '-0.01em', fontVariationSettings: '"SOFT" 100', wordBreak: 'break-word' }}>{item}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flexShrink: 0, padding: '14px 64px', borderTop: `2px solid ${pal.text}`, display: 'flex', justifyContent: 'space-between', fontFamily: 'Manrope, monospace', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: pal.faded }}>
        <span>{sourceNames && sourceNames.length > 0 ? `Sources: ${sourceNames.join(', ')}` : ''}</span>
        <span>mindloftdaily.com</span>
      </div>
    </div>
  );
}

/* ─── LAYOUT: Stack (heavy uppercase tier bands) ────────────────────────── */
function PosterStack({ list, items, modeLabel, sourceNames, pal }) {
  return (
    <div style={{ width: POSTER_W, height: POSTER_H, background: pal.bg, color: pal.text, boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '48px 56px 22px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Manrope, monospace', fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', color: pal.accent, fontWeight: 700, marginBottom: 14 }}>
          Mind Loft &middot; {list.category} &middot; {modeLabel}
        </div>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, textTransform: 'uppercase', fontSize: fitTitle(list.title, 74), lineHeight: 0.86, letterSpacing: '-0.04em', margin: 0, color: pal.text, maxWidth: '96%' }}>
          {list.title}
        </h1>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {items.map((item, i) => {
          const isTop = i === 0;
          return (
            <div key={i} style={{ flex: isTop ? 1.55 : 1, display: 'flex', alignItems: 'center', background: isTop ? pal.accent : 'transparent', borderTop: `2px solid ${isTop ? pal.accent : `rgba(${hexToRgb(pal.text)},0.16)`}`, padding: '0 56px', overflow: 'hidden' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: isTop ? 104 : 58, color: isTop ? pal.bg : `rgba(${hexToRgb(pal.text)},0.22)`, minWidth: isTop ? 150 : 108, flexShrink: 0, letterSpacing: '-0.06em', lineHeight: 0.8 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isTop ? 900 : 700, textTransform: 'uppercase', fontSize: isTop ? 48 : 28, color: isTop ? pal.bg : pal.text, lineHeight: 0.98, letterSpacing: '-0.02em', flex: 1, wordBreak: 'break-word' }}>{item}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flexShrink: 0, height: 46, background: pal.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px' }}>
        <span style={{ fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: pal.bg, opacity: 0.8 }}>{sourceNames && sourceNames.length > 0 ? sourceNames.join(' · ') : ''}</span>
        <span style={{ fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: pal.bg }}>mindloftdaily.com</span>
      </div>
    </div>
  );
}

/* ─── LAYOUT: Chart (rank rendered as a bar) ────────────────────────────── */
function PosterChart({ list, items, modeLabel, sourceNames, pal }) {
  const n = Math.max(items.length, 1);
  return (
    <div style={{ width: POSTER_W, height: POSTER_H, background: pal.bg, color: pal.text, boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '46px 60px 20px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Manrope, monospace', fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase', color: pal.accent, fontWeight: 700, marginBottom: 14 }}>
          Mind Loft &middot; {list.category}
        </div>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: fitTitle(list.title, 62), lineHeight: 0.9, letterSpacing: '-0.04em', margin: '0 0 8px', color: pal.text, maxWidth: '94%' }}>
          {list.title}
        </h1>
        <div style={{ fontFamily: 'Manrope, monospace', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: pal.faded }}>{modeLabel}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 60px 8px' }}>
        {items.map((item, i) => {
          const isTop = i === 0;
          const w = 100 - (i * (68 / Math.max(n - 1, 1)));
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9, borderBottom: i < items.length - 1 ? `1px solid rgba(${hexToRgb(pal.text)},0.12)` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ fontFamily: 'Manrope, monospace', fontWeight: 800, fontSize: isTop ? 26 : 18, color: i < 3 ? pal.accent : pal.faded, minWidth: 44, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isTop ? 800 : 600, fontSize: isTop ? 34 : 26, color: pal.text, lineHeight: 1.02, letterSpacing: '-0.02em', flex: 1, wordBreak: 'break-word' }}>{item}</span>
              </div>
              <div style={{ height: isTop ? 16 : 11, width: `${w}%`, background: i === 0 ? pal.accent : `rgba(${hexToRgb(pal.accent)},${Math.max(1 - i * 0.07, 0.28)})`, borderRadius: 3 }} />
            </div>
          );
        })}
      </div>
      <div style={{ flexShrink: 0, padding: '12px 60px 24px', borderTop: `2px solid ${pal.accent}`, display: 'flex', justifyContent: 'space-between', fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: pal.faded }}>
        <span>{sourceNames && sourceNames.length > 0 ? `Sources: ${sourceNames.join(', ')}` : ''}</span>
        <span>mindloftdaily.com</span>
      </div>
    </div>
  );
}

/* ─── LAYOUT: Spotlight (top-1 photo hero + ranked rows) ────────────────── */
function PosterSpotlight({ list, items, modeLabel, sourceNames, pal }) {
  const top = items[0] || '';
  const rest = items.slice(1);
  const topSrc = heroSrcFor(list, top);
  return (
    <div style={{ width: POSTER_W, height: POSTER_H, background: pal.bg, color: pal.text, boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '42px 56px 18px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Manrope, monospace', fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: pal.faded }}>
          <span style={{ color: pal.accent, fontWeight: 700 }}>Mind Loft</span>
          <span>{list.category} &middot; {modeLabel}</span>
        </div>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: fitTitle(list.title, 58), lineHeight: 0.9, letterSpacing: '-0.03em', margin: '16px 0 0', color: pal.text, maxWidth: '96%' }}>
          {list.title}
        </h1>
      </div>
      <div style={{ flex: '2.2 0 0', position: 'relative', margin: '0 56px', overflow: 'hidden', background: pal.accent }}>
        <PosterImg src={topSrc} alt={top} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.18) 56%, rgba(0,0,0,0))' }} />
        <div style={{ position: 'absolute', left: 28, right: 28, bottom: 24, display: 'flex', alignItems: 'flex-end', gap: 18 }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: 78, lineHeight: 0.78, color: pal.accent, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>01</span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 40, lineHeight: 1.0, letterSpacing: '-0.02em', color: T.white, flex: 1, paddingBottom: 6, wordBreak: 'break-word', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>{top}</span>
        </div>
      </div>
      <div style={{ flex: '3 0 0', display: 'flex', flexDirection: 'column', padding: '10px 56px 0' }}>
        {rest.map((item, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 22, borderTop: `1px solid rgba(${hexToRgb(pal.text)},0.16)` }}>
            <span style={{ fontFamily: 'Manrope, monospace', fontWeight: 800, fontSize: 28, color: i < 2 ? pal.accent : pal.faded, minWidth: 52, flexShrink: 0 }}>{String(i + 2).padStart(2, '0')}</span>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 25, color: pal.text, lineHeight: 1.04, flex: 1, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>{item}</span>
          </div>
        ))}
      </div>
      <div style={{ flexShrink: 0, padding: '10px 56px 26px', display: 'flex', justifyContent: 'space-between', fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: pal.faded }}>
        <span>{sourceNames && sourceNames.length > 0 ? `Sources: ${sourceNames.join(', ')}` : ''}</span>
        <span>mindloftdaily.com</span>
      </div>
    </div>
  );
}

/* ─── LAYOUT: Showcase (top-3 photo tiles + ranked rows) ────────────────── */
function PhotoCard({ item, rank, big, pal, list }) {
  const src = heroSrcFor(list, item);
  return (
    <div style={{ flex: big ? 1.5 : 1, position: 'relative', overflow: 'hidden', background: pal.accent }}>
      <PosterImg src={src} alt={item || ''} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.12) 60%, rgba(0,0,0,0))' }} />
      <div style={{ position: 'absolute', left: big ? 18 : 14, right: 12, bottom: big ? 16 : 11, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: big ? 34 : 22, lineHeight: 1, color: pal.bg, background: pal.accent, padding: big ? '5px 13px' : '3px 9px', flexShrink: 0 }}>{rank}</span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: big ? 30 : 19, lineHeight: 1.0, letterSpacing: '-0.02em', color: T.white, flex: 1, wordBreak: 'break-word', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{item || ''}</span>
      </div>
    </div>
  );
}

function PosterShowcase({ list, items, modeLabel, sourceNames, pal }) {
  const t3 = items.slice(0, 3);
  const rest = items.slice(3, 10);
  return (
    <div style={{ width: POSTER_W, height: POSTER_H, background: pal.bg, color: pal.text, boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '40px 56px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Manrope, monospace', fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: pal.faded }}>
          <span style={{ color: pal.accent, fontWeight: 700 }}>Mind Loft</span>
          <span>{list.category} &middot; Top {Math.min(items.length, 10)}</span>
        </div>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: fitTitle(list.title, 52), lineHeight: 0.9, letterSpacing: '-0.03em', margin: '14px 0 0', color: pal.text, maxWidth: '96%' }}>
          {list.title}
        </h1>
        <div style={{ marginTop: 6, fontFamily: 'Manrope, monospace', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: pal.faded }}>{modeLabel}</div>
      </div>
      <div style={{ flex: '2.6 0 0', display: 'flex', gap: 10, padding: '4px 56px 0' }}>
        <PhotoCard item={t3[0]} rank={1} big pal={pal} list={list} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {t3[1] !== undefined && <PhotoCard item={t3[1]} rank={2} pal={pal} list={list} />}
          {t3[2] !== undefined && <PhotoCard item={t3[2]} rank={3} pal={pal} list={list} />}
        </div>
      </div>
      <div style={{ flex: '2.1 0 0', display: 'flex', flexDirection: 'column', padding: '12px 56px 0' }}>
        {rest.map((item, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20, borderTop: `1px solid rgba(${hexToRgb(pal.text)},0.16)` }}>
            <span style={{ fontFamily: 'Manrope, monospace', fontWeight: 800, fontSize: 24, color: pal.faded, minWidth: 50, flexShrink: 0 }}>{String(i + 4).padStart(2, '0')}</span>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 24, color: pal.text, lineHeight: 1.02, flex: 1, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>{item}</span>
          </div>
        ))}
      </div>
      <div style={{ flexShrink: 0, padding: '10px 56px 24px', display: 'flex', justifyContent: 'space-between', fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: pal.faded }}>
        <span>{sourceNames && sourceNames.length > 0 ? `Sources: ${sourceNames.join(', ')}` : ''}</span>
        <span>mindloftdaily.com</span>
      </div>
    </div>
  );
}

/* ─── LAYOUT: Scorecard ─────────────────────────────────────────────────── */
function PosterScorecard({ list, items, modeLabel, sourceNames, pal }) {
  return (
    <div style={{ width: POSTER_W, height: POSTER_H, background: pal.bg, color: pal.text, boxSizing: 'border-box', fontFamily: 'Manrope, sans-serif', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: pal.accent, padding: '36px 56px 28px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.36em', textTransform: 'uppercase', color: pal.bg, opacity: 0.7, marginBottom: 10 }}>
          Mind Loft &nbsp;/&nbsp; {list.category}
        </div>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, fontSize: fitTitle(list.title, 64), lineHeight: 0.92, letterSpacing: '-0.03em', margin: '0 0 12px', color: pal.bg, maxWidth: 880 }}>
          {list.title}
        </h1>
        <div style={{ fontFamily: 'Manrope, monospace', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: pal.bg, opacity: 0.65 }}>
          {modeLabel}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {items.map((item, i) => {
          const isTop = i === 0;
          const isTop3 = i < 3;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', background: isTop ? `rgba(${hexToRgb(pal.accent)},0.12)` : i % 2 === 0 ? 'transparent' : `rgba(${hexToRgb(pal.text)},0.04)`, borderBottom: `1px solid rgba(${hexToRgb(pal.text)},0.1)`, flex: isTop ? '1.5 0 0' : '1 0 0' }}>
              <div style={{ width: isTop ? 92 : 68, alignSelf: 'stretch', background: isTop ? pal.accent : isTop3 ? `rgba(${hexToRgb(pal.accent)},0.2)` : `rgba(${hexToRgb(pal.text)},0.07)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Manrope, monospace', fontWeight: 900, fontSize: isTop ? 48 : 26, color: isTop ? pal.bg : isTop3 ? pal.accent : pal.faded, letterSpacing: '-0.04em' }}>
                  {i + 1}
                </span>
              </div>
              <div style={{ flex: 1, padding: isTop ? '14px 28px' : '8px 24px', minWidth: 0 }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isTop ? 800 : isTop3 ? 700 : 500, fontSize: isTop ? 40 : 26, color: pal.text, lineHeight: 1.1, display: 'block', wordBreak: 'break-word', letterSpacing: '-0.02em' }}>
                  {item}
                </span>
              </div>
              {isTop3 && (
                <div style={{ padding: '0 20px', display: 'flex', gap: 4, flexShrink: 0 }}>
                  {Array.from({ length: 3 - i }).map((_, d) => (
                    <div key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: pal.accent, opacity: 1 - d * 0.25 }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '12px 56px', flexShrink: 0, borderTop: `2px solid ${pal.accent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: pal.faded }}>
          {sourceNames && sourceNames.length > 0 ? `Sources: ${sourceNames.join(', ')}` : ''}
        </div>
        <div style={{ fontFamily: 'Manrope, monospace', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: pal.faded }}>mindloftdaily.com</div>
      </div>
    </div>
  );
}

/* ─── Hex helper ────────────────────────────────────────────────────────── */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

/* ─── Main Poster router ────────────────────────────────────────────────── */
const Poster = React.forwardRef(function Poster({ list, items, modeLabel, sourceNames, palette, fontStyle }, ref) {
  const pal = palette || COLOR_SCHEMES.classic;
  const props = { list, items, modeLabel, sourceNames, pal };

  let inner;
  if (fontStyle === 'ledger')         inner = <PosterLedger    {...props} />;
  else if (fontStyle === 'stack')     inner = <PosterStack     {...props} />;
  else if (fontStyle === 'chart')     inner = <PosterChart     {...props} />;
  else if (fontStyle === 'spotlight') inner = <PosterSpotlight {...props} />;
  else if (fontStyle === 'showcase')  inner = <PosterShowcase  {...props} />;
  else                                inner = <PosterScorecard {...props} />;

  return (
    <div ref={ref} style={{ width: POSTER_W, height: POSTER_H, overflow: 'hidden' }}>
      {inner}
    </div>
  );
});
