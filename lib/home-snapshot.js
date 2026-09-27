// LAST KNOWN PAGE (owner, 2026-09-27): the home paints exactly as the reader
// last saw it, then the reads update it in place.
//
// WHY A DOM SNAPSHOT AND NOT A STATE CACHE. The home is fed by seven reads
// through five hooks (useDayStats, useMyGames, useGroupStanding, /me, the
// daily board), each landing on its own clock: measured warm on 2026-09-27,
// statuses at ~280ms, pins at ~640ms, /me at ~1.0s, and 3 to 4s+ after a
// deploy. Each one reshaped the page (My games inserting, the cap flipping from
// "Join a group" to the lens switch, the Gators band dropping in above the
// slate). Caching every hook's payload would mean threading a second source of
// truth through all five. The rendered page is already the resolved form of
// all of them, so that is what is kept.
//
// HOW IT RUNS, on a full document load:
//   1. PRE (inline, before the live page in the HTML): validates the stored
//      snapshot and sets html[data-sot-snap], which hides the live page.
//   2. FILL (inline, after it): pours the snapshot into #sot-snap, which sits
//      over the live page, and corrects any tile the reader finished since the
//      snapshot was taken (from its sot_<key>_day breadcrumb).
//   3. React hydrates the live page underneath, invisibly. When every read has
//      landed, StageToday calls releaseHomeSnap(): leaf texts that changed are
//      marked, the snapshot is dropped, the live page shows, and the changed
//      figures flash once.
// A client-side navigation to "/" runs 1 and 2 from HomeSnapBox's layout
// effect instead (inline scripts do not execute on a client navigation).
//
// IT STANDS DOWN (shows the ordinary page) when: no snapshot, a different ET
// day (the first visit of a day belongs to StageWelcome anyway), the arrival
// has not played today, a different identity, a different register, any
// query string beyond tracking params, a hash, or a snapshot over 20h old.
// A 9s ceiling and any tap on a non-link in the snapshot release it early, so
// a broken read can never hold a stale page up.

export const SNAP_KEY = 'sot_home_snap';
export const SNAP_V = 1;
export const SNAP_ATTR = 'data-sot-snap';

// Plain ES5, as a STRING, so the exact same code runs from the inline scripts
// (server HTML) and from new Function on a client navigation. It defines
// window.__sotSnap(phase, onramp).
export const SNAP_JS = `window.__sotSnap=window.__sotSnap||function(phase,onramp){
var w=window,d=document,H=d.documentElement,A='${SNAP_ATTR}';
function et(){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date())}catch(x){return''}}
function off(){try{H.removeAttribute(A);var b=d.getElementById('sot-snap');if(b)b.innerHTML=''}catch(x){}}
try{
if(phase==='pre'){
if(H.hasAttribute(A))return;
var raw=localStorage.getItem('${SNAP_KEY}');if(!raw)return;
var s=JSON.parse(raw);if(!s||s.v!==${SNAP_V}||!s.html)return;
var today=et();if(!today||s.day!==today)return;
if(localStorage.getItem('sot_welcome_day')!==today)return;
var a=localStorage.getItem('sot_quiz_anon')||'',e='';
try{var id=JSON.parse(localStorage.getItem('sot_quiz_identity')||'null');e=(id&&id.email)||''}catch(x){}
if(s.who!==a+'|'+e)return;
if(s.theme!==(H.getAttribute('data-stage-boot')||'light'))return;
var q=w.location.search.replace(/^\\?/,'');
if(q){var ps=q.split('&');for(var i=0;i<ps.length;i++){if(!/^(utm_[a-z]+|fbclid|gclid|ref)=/.test(ps[i]))return}}
if(w.location.hash)return;
if(!(Date.now()-s.at<72e6))return;
w.__sotSnapHtml=s.html;H.setAttribute(A,'1');
setTimeout(function(){var b=d.getElementById('sot-snap');if(!b||!b.firstChild)off()},2500);
return;}
var box=d.getElementById('sot-snap');
if(!box||!H.hasAttribute(A))return;
if(!w.__sotSnapHtml){if(!box.firstChild)off();return}
box.innerHTML=w.__sotSnapHtml;w.__sotSnapHtml=null;
var t2=et(),root=box.firstElementChild,light=root&&root.getAttribute('data-stage-theme')==='light';
var tiles=box.querySelectorAll('a.sty-g[data-fk]');
for(var j=0;j<tiles.length;j++){var t=tiles[j],k=String(t.getAttribute('data-fk')).split(':').pop();
var cl=' '+t.className+' ';if(cl.indexOf(' done ')>=0)continue;
var c=null;try{c=JSON.parse(localStorage.getItem('sot_'+k+'_day')||'null')}catch(x){}
if(!c||c.d!==t2||!c.done)continue;
var cs=t.className.split(' '),keep=[];for(var m=0;m<cs.length;m++){var n=cs[m];if(n&&n!=='sty-g'&&n!=='open'&&n!=='gw'&&n!=='grp'&&n!=='done')keep.push(n)}
t.className=['sty-g','done'].concat(keep,['grp']).join(' ');
try{t.style.setProperty('--stg-onramp',light?((onramp&&onramp[k])||'#ffffff'):'#08222e')}catch(x){}
if(t.parentNode)t.parentNode.appendChild(t);}
w.__sotSnapRelease=off;
setTimeout(off,9000);
box.addEventListener('pointerdown',function(ev){var el=ev.target;while(el&&el!==box){if(el.tagName==='A')return;el=el.parentNode}off()},true);
}catch(x){off()}};`;

export const SNAP_CSS = `.sot-home{position:relative}
#sot-snap{position:absolute;top:0;left:0;right:0;z-index:2}
html:not([${SNAP_ATTR}]) #sot-snap{display:none}
html[${SNAP_ATTR}] .sot-live{opacity:0;pointer-events:none}
#sot-snap *,#sot-snap *::before,#sot-snap *::after{animation:none!important;transition:none!important}
.sot-chg{border-radius:4px;animation:sot-chg 1.6s ease-out}
@keyframes sot-chg{0%{background-color:color-mix(in srgb,var(--stg-brand,#7dd3fc) 34%,transparent)}100%{background-color:transparent}}
@media (prefers-reduced-motion:reduce){.sot-chg{animation:none}}`;

function etToday() {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date()); }
  catch (e) { return ''; }
}

function cleanQuery() {
  const q = window.location.search.replace(/^\?/, '');
  if (!q) return true;
  return q.split('&').every((p) => /^(utm_[a-z]+|fbclid|gclid|ref)=/.test(p));
}

// Transient things that must never be frozen into the page: overlays and the
// flash class itself. Styles are dropped too, since the live page carries them.
const STRIP = 'style,script,noscript,.stw,.prm-scrim,.gpp-scrim,.cnp-scrim,.stg-tpop';

export function saveHomeSnap(root) {
  try {
    if (!root || typeof window === 'undefined') return;
    if (document.documentElement.hasAttribute(SNAP_ATTR)) return;
    if (!cleanQuery() || window.location.hash) return;
    const day = etToday();
    if (!day) return;
    const clone = root.cloneNode(true);
    clone.querySelectorAll(STRIP).forEach((el) => el.remove());
    clone.querySelectorAll('.sot-chg').forEach((el) => el.classList.remove('sot-chg'));
    const html = clone.outerHTML;
    if (html.length > 700000) return;
    const a = localStorage.getItem('sot_quiz_anon') || '';
    let e = '';
    try { const id = JSON.parse(localStorage.getItem('sot_quiz_identity') || 'null'); e = (id && id.email) || ''; } catch (x) {}
    const snap = {
      v: SNAP_V, day, at: Date.now(), who: a + '|' + e,
      theme: root.getAttribute('data-stage-theme') || 'light', html,
    };
    localStorage.setItem(SNAP_KEY, JSON.stringify(snap));
  } catch (e) {
    // Quota or a serialization failure: drop the old one rather than keep a
    // snapshot that no longer matches what the reader last saw.
    try { localStorage.removeItem(SNAP_KEY); } catch (x) {}
  }
}

// A path per leaf that survives the two trees being separate copies: tag, first
// class and data-fk (tiles reorder, so their position is not their identity),
// then the index among siblings with that same signature.
function leafMap(root) {
  const out = new Map();
  const walk = (el, path) => {
    // A RollNum is one figure drawn as ten-digit columns, so its text is
    // always 0123456789; the real value is its aria-label.
    if (el.classList && el.classList.contains('rln')) {
      out.set(path, { el, t: el.getAttribute('aria-label') || '', rln: true });
      return;
    }
    const kids = el.children;
    if (!kids.length) {
      const t = (el.textContent || '').trim();
      if (t) out.set(path, { el, t });
      return;
    }
    const seen = {};
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i];
      if (k.tagName === 'STYLE' || k.tagName === 'SCRIPT' || k.tagName === 'svg' || k.tagName === 'SVG') continue;
      const fk = k.getAttribute('data-fk');
      const sig = k.tagName + '.' + (k.classList[0] || '') + (fk ? '[' + fk + ']' : '');
      seen[sig] = (seen[sig] || 0) + 1;
      walk(k, path + '>' + sig + '#' + seen[sig]);
    }
  };
  walk(root, '');
  return out;
}

// More changed leaves than this means the page is structurally different
// (another lens, a new day's slate), and a field of flashes would read as the
// stutter this exists to remove. It just swaps.
const MAX_FLASH = 24;

function rollFrom(oldEl, el) {
  try {
    const oc = oldEl.querySelectorAll('.rln-c');
    const nc = el.querySelectorAll('.rln-c');
    if (!nc.length || oc.length !== nc.length) return;
    const to = [];
    nc.forEach((c, i) => { to[i] = c.style.transform; c.style.transition = 'none'; c.style.transform = oc[i].style.transform; });
    void el.offsetWidth;
    nc.forEach((c, i) => { c.style.transition = ''; c.style.transform = to[i]; });
  } catch (e) {}
}

export function releaseHomeSnap(live) {
  try {
    const H = document.documentElement;
    if (!H.hasAttribute(SNAP_ATTR)) return;
    const box = document.getElementById('sot-snap');
    const snap = box && box.firstElementChild;
    const changed = [];
    if (snap && live) {
      const a = leafMap(snap);
      const b = leafMap(live);
      for (const [p, v] of b) {
        const old = a.get(p);
        if (old && old.t !== v.t) changed.push({ el: v.el, from: old.el, rln: v.rln });
      }
    }
    H.removeAttribute(SNAP_ATTR);
    window.__sotSnapRelease = null;
    // A rolled figure rolls FROM what the snapshot showed to what the read
    // says, the same slide RollNum gives any change, so a figure that moved
    // while the reader was away is seen moving. Taken before the flash test
    // so it happens even on a structurally changed page.
    changed.forEach((c) => { if (c.rln) rollFrom(c.from, c.el); });
    if (box) box.innerHTML = '';
    if (changed.length && changed.length <= MAX_FLASH) {
      changed.forEach(({ el }) => {
        el.classList.remove('sot-chg');
        void el.offsetWidth;
        el.classList.add('sot-chg');
        setTimeout(() => el.classList.remove('sot-chg'), 1800);
      });
    }
  } catch (e) {
    try { document.documentElement.removeAttribute(SNAP_ATTR); } catch (x) {}
  }
}
