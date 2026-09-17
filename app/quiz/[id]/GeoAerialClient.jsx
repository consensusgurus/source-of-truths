'use client';

// Place-the-cities map quiz board (format: 'place-map').
//
// A state silhouette is shown and the player has a single shared clock (default
// 60s) to click as close as possible to each of N named cities/towns. Each city
// is worth up to maxPerCity points (default 100): full credit within fullMiles
// (default 5) of the true spot, decaying linearly to zero at zeroMiles (default
// 60). Total = N * maxPerCity (e.g. 15 * 100 = 1500). One city is prompted at a
// time; after each click the true location flashes briefly while the clock keeps
// running, then the next city comes up. Reuses the same /api/quiz/* endpoints,
// leaderboard (Registered / All / Mobile / First try), ELO standing, and visual
// language as the other quiz boards.
//
// Scoring for ELO/metrics: this is registered as a "points quiz" in
// lib/quiz-scoring.js (questions = cities.length, max = maxPerCity), so the
// stored points total is graded as score/total (a 0..1 performance fraction) for
// ELO and shown as an estimated cities-nailed count for the "correct" metric,
// exactly like the timed-mcq lightning rounds. No discrete "correct" is sent.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Flag, Trophy, HelpCircle, MapPin, ScrollText, Swords } from 'lucide-react';
import JoinLeaderboardForm from './JoinLeaderboardForm';
import QuizStandings from './QuizStandings';
import LeaderboardSnippet from './LeaderboardSnippet';
import LeaderboardStrip from './LeaderboardStrip';
import QuizResultModal from './QuizResultModal';
import QuizLeaderboard from './QuizLeaderboard';
import ClueBox from './ClueBox';
import { similarQuizId } from '@/lib/quiz-similar';
import { getQuiz, QUIZZES } from '@/lib/quizzes';
import useAbandonFlush from './useAbandonFlush';
import { quizDept as deptOf, DEPT_LABEL } from '@/lib/quiz-departments';
import { PLACE_MAP_GEO } from '@/lib/place-map-geo';
import Grain from '../../Grain';
import Footer from '../../Footer';
import QuizNavHeader from '../../quizzes/QuizNavHeader';
import StageChrome from '../../StageChrome';
import QuizLoftFinish from './QuizLoftFinish';
import { isQuizStage, QUIZ_ACC_VARS } from '@/lib/quiz-stage';
import { useStageTheme } from '@/lib/stage-theme';
import QuizPlayOverlay from './QuizPlayOverlay';
import QuizIdleActions from './QuizIdleActions';
import { isMobileDevice } from '@/lib/is-mobile';
import { LB_POPS, LB_FILTERS, pickLb, lbEmptyNote } from '@/lib/quiz-lb';
import Count from '../../Count';
import { withRef } from '@/lib/referrals';
import { notifyShareCredit } from '@/app/ShareCreditPop';
import { savedIdentity } from '@/lib/saved-identity';
import { T } from '@/lib/theme';

const COLORS = {
  cream: T.surface,
  paper: T.paper,
  ink: T.ink,
  ember: T.accent,
  rust: T.danger,
  forest: T.success,
  faded: T.muted,
};
const MONO = "'Manrope', system-ui, -apple-system, sans-serif";
const SERIF = "'Manrope', system-ui, -apple-system, sans-serif";
const SANS = "'Manrope', system-ui, -apple-system, sans-serif";

const MAP = { land: '#e7ebf0', line: '#9aa6b4', sea: '#dbe6f1' };

function fmtWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function statsKey(id) { return `sot_quiz_${id}`; }
function loadStats(id) {
  if (typeof window === 'undefined') return { attempts: 0, best: 0, totalCorrect: 0 };
  try {
    return JSON.parse(localStorage.getItem(statsKey(id))) || { attempts: 0, best: 0, totalCorrect: 0 };
  } catch { return { attempts: 0, best: 0, totalCorrect: 0 }; }
}
function getAnonId() {
  if (typeof window === 'undefined') return null;
  try {
    let a = localStorage.getItem('sot_quiz_anon');
    if (!a) {
      a = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `a_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('sot_quiz_anon', a);
    }
    return a;
  } catch { return null; }
}
function recordResult(id, points) {
  const s = loadStats(id);
  const next = { attempts: s.attempts + 1, best: Math.max(s.best, points), totalCorrect: s.totalCorrect + points };
  try { localStorage.setItem(statsKey(id), JSON.stringify(next)); } catch {}
  return next;
}
function percentile(points, max) {
  const frac = max ? points / max : 0;
  return Math.round(Math.min(99, Math.max(2, Math.pow(frac, 1.35) * 100)));
}

// Great-circle-ish distance in miles between two [lon,lat] points (flat-earth
// approximation, exact enough at a single state's scale).
function milesBetween(aLon, aLat, bLon, bLat) {
  const dLat = (bLat - aLat) * 69;
  const dLon = (bLon - aLon) * 69 * Math.cos(((aLat + bLat) / 2) * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

const TICK_MS = 100;

export default function MapPlaceClient({ quizId, mobile = false }) {
  const searchParams = useSearchParams();
  // THE STAGE. Same three-way switch every daily uses, keyed by this file
  // rather than by a registry key, because a quiz has no registry row and
  // the unit of rollout is the CLIENT: see lib/quiz-stage.js.
  const QSTAGE = isQuizStage('GeoAerialClient', searchParams);
  const [stageTheme] = useStageTheme();
  // TEXT and FILL are separate names on purpose. Near-black TEXT is
  // invisible on this ground and has to move; a near-black FILL is a
  // perfectly good object on it and stays. One restyled COLORS would
  // conflate the two and turn every dark chip on the board pale.
  const INK = QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink;
  const FADED = QSTAGE ? 'var(--stg-mute,#8b95a8)' : COLORS.faded;
  const SURF = QSTAGE ? 'var(--stg-surf,rgba(255,255,255,0.045))' : T.white;
  const SURF_B = QSTAGE ? 'var(--stg-line,rgba(255,255,255,0.11))' : COLORS.line;
  // THE ONE QUIZ ACCENT, read as the variable the root publishes rather
  // than as a literal, so it follows the light switch. See lib/quiz-stage.js.
  const QACC = QSTAGE ? 'var(--stg-acc)' : COLORS.ember;
  const ON_ACC = QSTAGE ? 'var(--stg-onramp,#08222e)' : T.white;
  const router = useRouter();
  const quiz = useMemo(() => getQuiz(quizId), [quizId]);

  // ── Aerial map setup (Leaflet loaded from CDN at runtime; no SVG projection) ──
  const BM = (quiz && quiz.basemap) || {};
  const TILE_URL = BM.tileUrl || 'https://maps{s}.nyc.gov/xyz/1.0.0/photo/2018/{z}/{x}/{y}.png8';
  const TILE_SUBDOMAINS = BM.subdomains != null ? BM.subdomains : '1234';
  const TILE_ATTR = BM.attribution || '&copy; City of New York';
  const TILE_MAXNATIVE = BM.maxNativeZoom || 19;
  const TILE_BOUNDS = BM.tileBounds || [[40.4888, -74.2759], [40.9279, -73.6896]];
  const MAP_MAXBOUNDS = BM.maxBounds || [[40.49, -74.27], [40.93, -73.69]];
  const NYC_VIEW = BM.center || [40.758, -73.978];
  const NYC_ZOOM = BM.zoom || 12;
  const geo = useMemo(() => (quiz && Array.isArray(quiz.cities) && quiz.cities.length ? { ready: true } : null), [quiz]);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);
  const resolveRef = useRef(() => {});
  const resolvedRef = useRef(false);
  const phaseRef = useRef('idle');
  const idxRef = useRef(0);
  const orderRef = useRef([]);

  const cities = quiz && quiz.cities ? quiz.cities : [];
  const total = cities.length;
  const maxPer = quiz && quiz.maxPerCity ? quiz.maxPerCity : 100;
  const maxPoints = total * maxPer;
  const timeLimit = quiz && quiz.timeLimit ? quiz.timeLimit : 60;
  const perGuess = quiz && quiz.perGuessTime ? quiz.perGuessTime : null;
  const clockSecs = perGuess || timeLimit;
  const fullMiles = quiz && quiz.fullMiles != null ? quiz.fullMiles : 5;
  const zeroMiles = quiz && quiz.zeroMiles != null ? quiz.zeroMiles : 60;
  function scoreFor(miles) {
    if (miles <= fullMiles) return maxPer;
    if (miles >= zeroMiles) return 0;
    return Math.round(maxPer * (zeroMiles - miles) / (zeroMiles - fullMiles));
  }

  const [tab, setTab] = useState('play');

  // ── Game state ──
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [dismissed, setDismissed] = useState(false);
  const [order, setOrder] = useState([]);       // shuffled city indices
  const [idx, setIdx] = useState(0);            // how many cities prompted/placed
  const [placements, setPlacements] = useState([]); // [{ cityIdx, x, y, pts, miles }]
  const [flashIdx, setFlashIdx] = useState(-1);  // placement index currently flashing its truth
  const [remaining, setRemaining] = useState(timeLimit * 1000);
  const [lastElapsed, setLastElapsed] = useState(null);

  const [stats, setStats] = useState({ attempts: 0, best: 0, totalCorrect: 0 });
  const [board, setBoard] = useState({ plays: 0, best: null, topTime: null, leaderboard: [], leaderboardAll: [], leaderboardMobile: [], leaderboardFirst: [], leaderboards: {} });
  const [lbPop, setLbPop] = useState('registered');
  const [lbFilter, setLbFilter] = useState('all');
  const [identity, setIdentity] = useState(null);
  const [eloBefore, setEloBefore] = useState(null);
  const [eloAfter, setEloAfter] = useState(null);
  const [revealAll, setRevealAll] = useState(false); // results-card map recap toggle

  const [copied, setCopied] = useState(false);

  // Critique modal
  const [qOpen, setQOpen] = useState(false);
  const [qMsg, setQMsg] = useState('');
  const [qName, setQName] = useState('');
  const [qEmail, setQEmail] = useState('');
  // A signed-in player's name + email prefill the reply fields, so a report
  // always comes back with somewhere to answer it. Still editable, still
  // optional: a guest sees empty fields exactly as before.
  useEffect(() => {
    const who = savedIdentity();
    if (who.username) setQName((v) => v || who.username);
    if (who.email) setQEmail((v) => v || who.email);
  }, []);
  const [qSent, setQSent] = useState(false);
  const [qBusy, setQBusy] = useState(false);

  const timerRef = useRef(null);
  const flashRef = useRef(null);
  const deadlineRef = useRef(0);
  const startRef = useRef(null);
  const endedRef = useRef(false);
  const revealingRef = useRef(false);
  const viewedRef = useRef(false);
  const svgRef = useRef(null);

  const points = placements.reduce((s, p) => s + (p.pts || 0), 0);
  const isTopScore = phase === 'done' && board.best != null && lastElapsed != null
    && points === board.best && board.topTime != null && lastElapsed <= board.topTime;

  function fetchQuizMe(setter) {
    try {
      const qs = new URLSearchParams();
      const anon = getAnonId();
      if (anon) qs.set('anonId', anon);
      let em = identity && identity.email ? identity.email : null;
      if (!em) { try { const j = JSON.parse(localStorage.getItem('sot_quiz_identity')); if (j && j.email) em = j.email; } catch (e) {} }
      if (em) qs.set('email', em);
      fetch(`/api/quiz/me?${qs.toString()}`).then((r) => r.json()).then((d) => { if (d && d.found) setter(d); }).catch(() => {});
    } catch (e) {}
  }
  function refreshBoard() {
    fetch(`/api/quiz/board?quizId=${encodeURIComponent(quizId)}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best ?? null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [], leaderboardMobile: d.leaderboardMobile || [], leaderboardFirst: d.leaderboardFirst || [], leaderboards: d.leaderboards || {} }); })
      .catch(() => {});
  }

  useEffect(() => {
    setStats(loadStats(quizId));
    try {
      const id = JSON.parse(localStorage.getItem('sot_quiz_identity'));
      if (id && id.email) setIdentity(id);
    } catch {}
    refreshBoard();
    fetchQuizMe(setEloBefore);
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch('/api/quiz/view', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId }) }).catch(() => {});
    }
    return () => { clearInterval(timerRef.current); clearTimeout(flashRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Record an in-progress game if the player leaves before finishing.
  const abandon = useAbandonFlush(() => {
    if (endedRef.current || !startRef.current) return null;
    if (phase === 'idle' || phase === 'done') return null;
    if (loadStats(quizId).attempts !== 0) return null;
    const elapsed = Math.min(clockSecs * total, Math.round((Date.now() - startRef.current) / 1000));
    if (!elapsed) return null;
    return { quizId, score: placements.reduce((s, p) => s + (p.pts || 0), 0), total: maxPoints, timeElapsed: elapsed, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice() };
  });

  function stopTimer() { clearInterval(timerRef.current); timerRef.current = null; }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.L) { setLeafletReady(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'; s.async = true;
    s.onload = () => setLeafletReady(true);
    document.body.appendChild(s);
  }, []);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => () => { if (mapRef.current) { try { mapRef.current.remove(); } catch (e) {} mapRef.current = null; } }, []);

  useEffect(() => {
    if (phase !== 'playing' || !leafletReady || !mapElRef.current || mapRef.current) return;
    const L = window.L;
    const map = L.map(mapElRef.current, { minZoom: 11, maxZoom: 19, zoomControl: true }).setView(NYC_VIEW, NYC_ZOOM);
    map.setMaxBounds(L.latLngBounds(MAP_MAXBOUNDS[0], MAP_MAXBOUNDS[1]));
    L.tileLayer(TILE_URL, { subdomains: TILE_SUBDOMAINS, minNativeZoom: 8, maxNativeZoom: TILE_MAXNATIVE, maxZoom: 19, bounds: L.latLngBounds(TILE_BOUNDS[0], TILE_BOUNDS[1]), attribution: TILE_ATTR }).addTo(map);
    map.on('click', (e) => { if (phaseRef.current === 'playing' && !resolvedRef.current) resolveRef.current(e.latlng); });
    mapRef.current = map;
    setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 60);
  }, [phase, leafletReady]);

  function clearLayers() {
    const map = mapRef.current;
    if (map) layersRef.current.forEach((l) => { try { map.removeLayer(l); } catch (e) {} });
    layersRef.current = [];
  }
  function drawReveal(city, glatlng, miles, pts) {
    const L = window.L; const map = mapRef.current;
    if (!L || !map) return;
    const actual = [city.lat, city.lon];
    const aMark = L.circleMarker(actual, { radius: 9, color: T.white, weight: 2.5, fillColor: COLORS.forest, fillOpacity: 1 }).addTo(map).bindPopup('<b>' + city.name + '</b>');
    layersRef.current.push(aMark);
    if (glatlng) {
      const g = L.circleMarker(glatlng, { radius: 7, color: INK, weight: 2, fillColor: T.white, fillOpacity: 1 }).addTo(map);
      const line = L.polyline([glatlng, actual], { color: `var(--stg-acc-ink,${COLORS.ember})`, weight: 2.5, dashArray: '5,7' }).addTo(map);
      layersRef.current.push(g, line);
      try { map.fitBounds(L.latLngBounds([glatlng, actual]).pad(0.5)); } catch (e) {}
    } else { try { map.setView(actual, 15); } catch (e) {} }
    aMark.openPopup();
  }
  function beginRound() {
    resolvedRef.current = false;
    clearLayers();
    if (mapRef.current) { try { mapRef.current.setView(NYC_VIEW, NYC_ZOOM); } catch (e) {} }
    setFlashIdx(-1);
    setRemaining(clockSecs * 1000);
    deadlineRef.current = Date.now() + clockSecs * 1000;
    stopTimer();
    timerRef.current = setInterval(() => {
      const left = deadlineRef.current - Date.now();
      if (left <= 0) { stopTimer(); setRemaining(0); if (!resolvedRef.current) resolveRef.current(null); }
      else setRemaining(left);
    }, TICK_MS);
  }
  function recordGuess(glatlng) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    stopTimer();
    const i = idxRef.current;
    const city = cities[orderRef.current[i]];
    if (!city) return;
    let miles = null, pts = 0;
    if (glatlng) { miles = milesBetween(glatlng.lng, glatlng.lat, city.lon, city.lat); pts = scoreFor(miles); }
    drawReveal(city, glatlng || null, miles, pts);
    setPlacements((prev) => { const next = [...prev, { cityIdx: orderRef.current[i], glat: glatlng ? glatlng.lat : null, glng: glatlng ? glatlng.lng : null, pts, miles }]; setFlashIdx(next.length - 1); return next; });
    const nextIdx = i + 1;
    clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => {
      if (endedRef.current) return;
      idxRef.current = nextIdx;
      setIdx(nextIdx);
      if (nextIdx >= total) finishGame();
      else beginRound();
    }, 1100);
  }
  resolveRef.current = recordGuess;

  function startGame(force) {
    if (!force && phase !== 'idle') return;
    if (!geo || !leafletReady) return;
    endedRef.current = false;
    revealingRef.current = false;
    const ord = cities.map((_, i) => i);
    for (let i = ord.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = ord[i]; ord[i] = ord[j]; ord[j] = t; }
    orderRef.current = ord;
    idxRef.current = 0;
    setOrder(ord);
    setPlacements([]);
    setFlashIdx(-1);
    setIdx(0);
    setRevealAll(false);
    setRemaining(clockSecs * 1000);
    setPhase('playing');
    startRef.current = Date.now();
    beginRound();
  }

  function finishGame() {
    if (endedRef.current) return;
    abandon.markFlushed();
    endedRef.current = true;
    stopTimer();
    setPhase('done');
    setFlashIdx(-1);
    setPlacements((prev) => {
      const finalPoints = prev.reduce((s, p) => s + (p.pts || 0), 0);
      const elapsed = startRef.current ? Math.min(clockSecs * total, Math.round((Date.now() - startRef.current) / 1000)) : clockSecs * total;
      setLastElapsed(elapsed);
      setStats(recordResult(quizId, finalPoints));
      {
        fetch('/api/quiz/result', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizId, score: finalPoints, total: maxPoints, timeElapsed: elapsed, email: identity?.email || undefined, anonId: getAnonId(), isMobile: isMobileDevice(), referrer: (typeof document !== 'undefined' ? document.referrer : '') }),
        })
          .then((r) => r.json())
          .then((d) => { if (d && !d.error) setBoard({ plays: d.plays || 0, best: d.best ?? null, topTime: d.topTime ?? null, leaderboard: d.leaderboard || [], leaderboardAll: d.leaderboardAll || [], leaderboardMobile: d.leaderboardMobile || [], leaderboardFirst: d.leaderboardFirst || [], leaderboards: d.leaderboards || {} }); })
          .then(() => fetchQuizMe(setEloAfter))
          .catch(() => { fetchQuizMe(setEloAfter); });
      }
      return prev;
    });
  }

  function giveUp() { if (phase === 'playing') finishGame(); }
  function playAgain() {
    // Restart immediately into a fresh round (no return to the idle screen).
    setDismissed(false);
    startGame(true);
  }

  async function submitQuestion() {
    if (qBusy) return;
    setQBusy(true);
    try {
      await fetch('/api/complaints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId: quiz.id, listTitle: `[Quiz] ${quiz.title}`, message: qMsg.trim(), name: qName.trim(), email: qEmail.trim() }) });
    } catch (e) {}
    setQSent(true);
    setQBusy(false);
  }

  const shareUrl = withRef(typeof window !== 'undefined' ? window.location.href : (quiz ? `https://mindloftdaily.com/quiz/${quiz.id}` : ''));
  const resultMsg = phase === 'done' ? `I scored ${points}/${maxPoints} on "${quiz ? quiz.title : ''}". Can you beat me?` : `Can you beat my score on "${quiz ? quiz.title : ''}"?`;
  function openShare(kind) { const u = encodeURIComponent(shareUrl); const t = encodeURIComponent(resultMsg); const url = kind === 'x' ? `https://twitter.com/intent/tweet?text=${t}&url=${u}` : kind === 'reddit' ? `https://www.reddit.com/submit?url=${u}&title=${t}` : kind === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${u}` : kind === 'whatsapp' ? `https://api.whatsapp.com/send?text=${t}%20${u}` : shareUrl; try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) {} }
  function copyResult() { if (notifyShareCredit(`${resultMsg}\n${shareUrl}`)) return; try { navigator.clipboard?.writeText(`${resultMsg}\n${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); } catch (e) {} }
  function share() {
    const text = 'Can you beat my score?';
    if (typeof navigator !== 'undefined' && navigator.share) { navigator.share({ title: quiz.title, text, url: shareUrl }).catch(() => {}); }
    else { navigator.clipboard?.writeText(`${text} ${shareUrl}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }
  }

  if (!quiz) {
    return (
      <div className={QSTAGE ? 'stage-page' : (undefined)}
        data-stage-theme={QSTAGE ? stageTheme : undefined}
        style={{ ...(QSTAGE ? QUIZ_ACC_VARS : null), minHeight: '100vh', position: 'relative', background: QSTAGE ? 'var(--stg-ground)' : COLORS.cream, color: QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink }}>
        {!QSTAGE && <Grain />}
        <div style={{ position: 'relative', zIndex: 2, padding: 48, textAlign: 'center' }}>
          <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: FADED }}>That quiz seems to have wandered off.</p>
          <button onClick={() => router.push('/')} style={{ marginTop: 16, background: `var(--stg-raise,${COLORS.ink})`, color: `var(--stg-ink,${COLORS.cream})`, border: 'none', padding: '10px 20px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}>Back home</button>
        </div>
        {!QSTAGE && <Footer />}
      </div>
    );
  }

  const bestLabel = board.best != null ? board.best : '—';
  const lbRows = pickLb(board, lbPop, lbFilter);
  const secsLeft = Math.ceil(remaining / 1000);
  const timeFrac = Math.max(0, Math.min(1, remaining / (clockSecs * 1000)));
  const lowClock = phase === 'playing' && remaining <= 10000;
  const promptCity = phase === 'playing' && idx < total ? cities[order[idx]] : null;
  const flash = flashIdx >= 0 ? placements[flashIdx] : null;

  const eloDept = deptOf(quiz);
  const eloDeptLabel = DEPT_LABEL[eloDept] || 'Category';
  const eloPanel = <QuizStandings eloAfter={eloAfter} eloBefore={eloBefore} eloDept={eloDept} eloDeptLabel={eloDeptLabel} fill />;

  // Markers layer: persistent click crosses, the active truth flash, and (on the
  // done screen) every true city with its name.
  function Markers() {
    if (!geo) return null;
    const els = [];
    placements.forEach((p, i) => {
      const hot = i === flashIdx || phase === 'done';
      els.push(
        <g key={`x${i}`}>
          <line x1={p.x - 5} y1={p.y - 5} x2={p.x + 5} y2={p.y + 5} stroke={COLORS.rust} strokeWidth={hot ? 2.2 : 1.4} opacity={hot ? 1 : 0.55} />
          <line x1={p.x - 5} y1={p.y + 5} x2={p.x + 5} y2={p.y - 5} stroke={COLORS.rust} strokeWidth={hot ? 2.2 : 1.4} opacity={hot ? 1 : 0.55} />
        </g>
      );
    });
    if (flash && phase === 'playing') {
      const c = cities[flash.cityIdx];
      const t = geo.proj(c.lon, c.lat);
      els.push(
        <g key="flash">
          <line x1={flash.x} y1={flash.y} x2={t[0]} y2={t[1]} stroke={COLORS.faded} strokeWidth={1} strokeDasharray="3 3" />
          <circle cx={t[0]} cy={t[1]} r={4} fill={COLORS.forest} stroke={T.white} strokeWidth={1.4} />
          <text x={(flash.x + t[0]) / 2} y={(flash.y + t[1]) / 2 - 7} textAnchor="middle" fontFamily={MONO} fontSize={11} fontWeight={800} fill={flash.pts >= maxPer * 0.7 ? COLORS.forest : flash.pts >= maxPer * 0.3 ? COLORS.rust : COLORS.ember} stroke={T.white} strokeWidth={2.6} paintOrder="stroke">{Math.round(flash.miles)} mi · +{flash.pts}</text>
        </g>
      );
    }
    if (phase === 'done') {
      const placedBy = {};
      placements.forEach((p) => { placedBy[p.cityIdx] = p; });
      cities.forEach((c, ci) => {
        const t = geo.proj(c.lon, c.lat);
        const p = placedBy[ci];
        els.push(
          <g key={`c${ci}`}>
            {p ? <line x1={p.x} y1={p.y} x2={t[0]} y2={t[1]} stroke={COLORS.faded} strokeWidth={0.9} strokeDasharray="3 3" /> : null}
            <circle cx={t[0]} cy={t[1]} r={3.6} fill={COLORS.forest} stroke={T.white} strokeWidth={1.3} />
            <text x={t[0] + 6} y={t[1] + 3} fontFamily={MONO} fontSize={8.5} fontWeight={600} fill={COLORS.ink} stroke={MAP.sea} strokeWidth={2.4} paintOrder="stroke">{c.name}</text>
          </g>
        );
      });
    }
    return <g>{els}</g>;
  }

  const recap = phase === 'done' ? placements.map((p) => ({ name: cities[p.cityIdx].name, miles: p.miles, pts: p.pts })).sort((a, b) => b.pts - a.pts) : [];

  // Mobile fullscreen play popup: open while the game is actively running.
  // On 'done' it closes and the QuizResultModal popup takes over; pre-game
  // ('idle') the board renders inline as before.
  const mPlayOverlay = mobile === true && phase === 'playing';

  return (
    <div className={QSTAGE ? 'stage-page' : (undefined)}
      data-stage-theme={QSTAGE ? stageTheme : undefined}
      style={{ ...(QSTAGE ? QUIZ_ACC_VARS : null), minHeight: '100vh', position: 'relative', overflow: 'clip', background: QSTAGE ? 'var(--stg-ground)' : COLORS.cream, color: QSTAGE ? 'var(--stg-ink,#e9edf4)' : COLORS.ink }}>
      {!QSTAGE && <div style={{ position: 'relative', zIndex: 3 }}><QuizNavHeader /></div>}
      {/* THE CAP. Comments live above the element because a JSX comment
          between attributes parses in esbuild and not in SWC, which is the
          compiler that matters. See scripts/patch-quiz-stage-cap.mjs for
          why the score and the maximum are read off this client's own end
          card rather than inferred from the names of its variables. */}
      {QSTAGE && (
        <StageChrome
          name={quiz.title}
          cat={DEPT_LABEL[deptOf(quiz)] || quiz.category || 'Quiz'}
          dateLabel={`${total} ${total === 1 ? 'place' : 'places'}`}
          outcome={phase === 'done' ? (points === maxPoints ? 'won' : points > 0 ? 'part' : 'lost') : null}
          figures={phase === 'done' ? [] : [{ v: `${points}/${maxPoints}`, k: 'Score' }]}
          progress={maxPoints ? points / maxPoints : 0}
          quizId={quiz.id}
          scoreWord="points"
          stripOn={phase !== 'playing'}
          panelBody={<QuizLeaderboard board={board} identity={identity} total={maxPoints} />}
        />
      )}
      <div className="qzf-w" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto', padding: '4px 38px 80px' }}><style dangerouslySetInnerHTML={{ __html: `@media(max-width:560px){.qzf-w{padding-left:14px !important;padding-right:14px !important;}}@media(max-width:480px){.qz-resrow{flex-direction:column !important;}}` }} /><div className="qzf-line" aria-hidden="true" />

        <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');` }} />

        {/* Header */}
        <div style={{ paddingBottom: 0, marginTop: 8, ...(phase === 'done' ? { maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' } : null) }}>
          {!QSTAGE && <h1 style={{ fontFamily: SANS, fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: 0, color: INK }}>{quiz.title}</h1>}
          {!QSTAGE && tab !== 'stats' && phase !== 'playing' && <LeaderboardStrip board={board} identity={identity} onOpen={() => setTab('stats')} />}
        </div>

        <div style={{ marginTop: 24 }} />

        {/* ── PLAY ── */}
        {tab === 'play' && (
          <QuizPlayOverlay open={mPlayOverlay} stage={QSTAGE}>
            {/* Scoreboard + timer (sticky) — hidden once the results popup takes over */}
            {phase !== 'done' && (
            <div style={{ position: 'sticky', top: 0, zIndex: 1200, background: `var(--stg-surf,${COLORS.cream})`, paddingBottom: 4 }}>
              <div style={{ background: `var(--stg-surf2,${COLORS.paper})`, borderRadius: 12, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '12px clamp(12px, 3.5vw, 20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'clamp(10px, 2.5vw, 20px)' }}>
                  <div style={{ flex: 'none' }}>
                    <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(20px, 5vw, 32px)', lineHeight: 1 }}>{points}<span style={{ fontSize: 'clamp(13px, 3vw, 18px)', color: FADED }}>/{maxPoints}</span></div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Points</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'center', borderLeft: `1px solid var(--stg-line,${COLORS.faded}33)`, borderRight: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '0 clamp(8px, 2vw, 18px)' }}>
                    {phase === 'playing' ? (
                      <>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, marginBottom: 3 }}>Find</div>
                        <ClueBox current={promptCity ? promptCity.name : ''} clues={cities.map((c) => c.name)} textStyle={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(17px, 2.8vw, 26px)', lineHeight: 1.1, overflowWrap: 'break-word', wordBreak: 'break-word' }} />
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(20px, 5vw, 32px)', lineHeight: 1, color: `var(--stg-acc-ink,${COLORS.ember})` }}>{bestLabel}</div>
                        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>Best · <Count value={board.plays} /> {board.plays === 1 ? 'play' : 'plays'}</div>
                      </>
                    )}
                  </div>
                  <div style={{ flex: 'none', textAlign: 'right' }}>
                    <div style={{ fontFamily: MONO, fontSize: 'clamp(18px, 4.5vw, 28px)', lineHeight: 1, color: phase === 'playing' ? (lowClock ? `var(--stg-acc-ink,${COLORS.ember})` : `var(--stg-ink,${COLORS.ink})`) : `var(--stg-mute,${COLORS.faded})` }}>{phase === 'playing' ? fmtTime(secsLeft) : fmtTime(clockSecs)}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>{phase === 'idle' ? `${total} rounds` : `Round ${Math.min(idx + (phase === 'playing' ? 1 : 0), total)}/${total}`}</div>
                  </div>
                </div>
                {phase === 'playing' && (
                  <div style={{ height: 8, marginTop: 10, background: `var(--stg-surf,${COLORS.cream})`, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${timeFrac * 100}%`, background: lowClock ? `var(--stg-bad,${COLORS.ember})` : `var(--stg-good,${COLORS.forest})`, transition: `width ${TICK_MS}ms linear` }} />
                  </div>
                )}
              </div>
            </div>
            )}

            {/* IDLE — start screen */}
            {phase === 'idle' && (
              <div style={{ textAlign: 'center', padding: '26px 24px 30px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, marginTop: 12 }}>
                <MapPin size={26} strokeWidth={2.2} style={{ color: `var(--stg-acc-ink,${COLORS.ember})` }} />
                <h2 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26, margin: '8px 0 6px' }}>Know the city?</h2>
                <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', color: FADED, margin: '0 0 20px' }}>
                  {maxPoints} points in play. {maxPoints} means all {total} dead-on.
                </p>
                <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.5, color: FADED, maxWidth: 460, margin: '0 auto 16px' }}>{quiz.blurb}</p>
                <QuizIdleActions onStart={startGame} startDisabled={!leafletReady} startLabel={leafletReady ? 'Start' : 'Loading map…'} quizId={quizId} onLeaderboard={() => setTab('stats')} />
              </div>
            )}

            {/* PLAYING — the prompt + map */}
            {phase === 'playing' && (
              <div style={{ marginTop: 12 }}>
                <div style={{ maxWidth: 820, margin: '0 auto', borderRadius: 8, overflow: 'hidden', border: `1px solid var(--stg-line,${COLORS.faded}55)` }}>
                  <div ref={mapElRef} style={{ height: 'clamp(440px, 66vh, 660px)', width: '100%', background: '#0b1a2b', cursor: 'crosshair', position: 'relative', zIndex: 0 }} />
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={giveUp} style={ghostBtn(false)}><Flag size={12} strokeWidth={2.5} /> End now</button>
                </div>
              </div>
            )}

            {/* DONE — results popup */}
            {phase === 'done' && (
              <>
                <QuizResultModal quiz={quiz} board={board} identity={identity} lastElapsed={lastElapsed} onRegister={() => setTab('join')}
                open={!QSTAGE && (!dismissed)}
                onClose={() => setDismissed(true)}
                eyebrow={points === maxPoints ? 'Perfect map' : placements.length < total ? 'Ended early' : 'Final score'}
                score={points}
                total={maxPoints}
                headline={`${placements.length} of ${total} placed · ${isTopScore ? 'you are the top score' : `you beat ${percentile(points, maxPoints)}% of players`}`}
                subline={board.best != null ? (points >= board.best ? `That is the high score to beat.` : `The high score to beat is ${board.best}.`) : 'Be the first to set the pace.'}
                leaderboard={<QuizLeaderboard board={board} identity={identity} total={maxPoints} />}
                placement={(() => { const rows = board.leaderboardAll || []; if (identity) { const i = rows.findIndex((r) => r.username === identity.username); if (i >= 0) return i + 1; } if (lastElapsed == null || !rows.length) return null; let b = 0; for (const r of rows) { if (r.score > points || (r.score === points && r.timeElapsed < lastElapsed)) b++; } return b + 1; })()}
                standings={eloPanel}
                onPlayAgain={playAgain}
                onPlaySimilar={() => { const sid = similarQuizId(quiz); if (sid) router.push(`/quiz/${sid}`); }}
                onLeaderboard={() => setTab('stats')}
                onShare={() => setTab('share')}
                onReport={() => { setQSent(false); setQOpen(true); }}
              />
              </>
            )}
          </QuizPlayOverlay>
        )}

        {QSTAGE && phase === 'done' && (
          <QuizLoftFinish
            stage={QSTAGE}
            quiz={quiz}
            score={points}
            total={maxPoints}
            elapsed={lastElapsed}
            board={board}
            identity={identity}
            topScore={isTopScore}
            onReplay={playAgain}
            onJoin={() => setTab('join')}
          />
        )}
        {/* ── STATS ── */}
        {tab === 'stats' && (
          <div>
            <button onClick={() => setTab('play')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 }}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: `var(--stg-acc-ink,${COLORS.ember})`, marginBottom: 14 }}>Your record</div>
            {stats.attempts === 0 ? (
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 17, color: FADED }}>Play a round and your record shows up here. Join the leaderboard to keep it, no email needed.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <StatBox label="Best score" value={`${stats.best}`} accent />
                <StatBox label="Your average" value={`${Math.round(stats.totalCorrect / stats.attempts)}`} />
                <StatBox label="Attempts" value={stats.attempts} />
              </div>
            )}

            <div style={{ borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, marginTop: 26, paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: FADED }}>Leaderboard</div>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: FADED }}>{bestLabel} best · <Count value={board.plays} /> {board.plays === 1 ? 'play' : 'plays'}</div>
              </div>

              {board.plays > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, width: 'fit-content' }}>
                  <div style={{ display: 'flex', borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`, width: 'fit-content' }}>
                    {LB_POPS.map(([k, label], idx2) => {
                      const on = lbPop === k;
                      return (
                        <button key={k} onClick={() => setLbPop(k)} style={{ padding: '6px 14px', background: on ? COLORS.ink : 'transparent', color: on ? T.white : `var(--stg-mute,${COLORS.faded})`, border: 'none', borderLeft: idx2 === 0 ? 'none' : `1px solid var(--stg-line,${COLORS.faded}55)`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>{label}</button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`, width: 'fit-content' }}>
                    {LB_FILTERS.map(([k, label], idx2) => {
                      const on = lbFilter === k;
                      return (
                        <button key={k} onClick={() => setLbFilter(k)} style={{ padding: '6px 14px', background: on ? COLORS.ink : 'transparent', color: on ? T.white : `var(--stg-mute,${COLORS.faded})`, border: 'none', borderLeft: idx2 === 0 ? 'none' : `1px solid var(--stg-line,${COLORS.faded}55)`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>{label}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {lbRows.length === 0 ? (
                <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 16, color: FADED }}>
                  {lbEmptyNote(lbFilter) || <>No one has posted a score yet. <button onClick={() => setTab('join')} style={{ background: 'none', border: 'none', padding: 0, color: `var(--stg-acc-ink,${COLORS.ember})`, font: 'inherit', fontStyle: 'italic', textDecoration: 'underline', cursor: 'pointer' }}>Join the leaderboard</button> and be first.</>}
                </p>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 76px 64px', gap: 8, padding: '0 14px 8px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: FADED }}>
                    <span>#</span><span>Username</span><span style={{ textAlign: 'right' }}>Points</span><span style={{ textAlign: 'right' }}>Time</span>
                  </div>
                  {lbRows.map((row, i) => {
                    const mine = identity && row.username === identity.username;
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 76px 64px', gap: 8, alignItems: 'center', padding: '11px 14px', marginBottom: 6, background: mine ? `var(--stg-acc-tint,${T.white})` : `var(--stg-surf,${COLORS.paper})`, borderRadius: 10, border: `1px solid ${mine ? `var(--stg-acc,${COLORS.ember})` : `var(--stg-line,${COLORS.faded + '22'})`}` }}>
                        <span style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 18, color: i < 3 ? `var(--stg-acc-ink,${COLORS.ember})` : `var(--stg-mute,${COLORS.faded})` }}>{i + 1}</span>
                        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.userKey ? <a href={`/quizzes/hub?player=${encodeURIComponent(row.userKey)}`} style={{ color: 'inherit', textDecoration: 'none', borderBottom: `1px dotted var(--stg-line,${COLORS.faded}88)`, cursor: 'pointer' }}>{row.username}</a> : row.username}{mine ? ' (you)' : ''}{row.tryNum ? <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 400, color: FADED, marginLeft: 6 }}>{row.tryNum > 1 ? '(retried)' : '(1st Try)'}</span> : ''}</span>
                          {row.playedAt ? <span style={{ fontFamily: MONO, fontSize: 10.5, color: FADED }}>{fmtWhen(row.playedAt)}</span> : null}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 14, textAlign: 'right' }}>{row.score}</span>
                        <span style={{ fontFamily: MONO, fontSize: 14, textAlign: 'right', color: FADED }}>{fmtTime(row.timeElapsed)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SHARE ── */}
        {tab === 'share' && (
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <div style={{ textAlign: 'left' }}><button onClick={() => setTab('play')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 }}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button></div>
            <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 19, color: INK, maxWidth: 480, margin: '0 auto 20px' }}>{phase === 'done' ? `You scored ${points} of ${maxPoints}. Challenge someone to beat it.` : 'Send this map quiz to someone who thinks they know their geography.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              {[['x', 'X'], ['reddit', 'Reddit'], ['facebook', 'Facebook'], ['whatsapp', 'WhatsApp']].map(([k, label]) => (
                <button key={k} onClick={() => openShare(k)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 18px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              <button onClick={copyResult} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf,${COLORS.cream})`, color: INK, cursor: 'pointer' }}>Copy result</button>
            </div>
            <a href={`/duel/new?quiz=${encodeURIComponent(quizId)}`} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, padding: '0 28px', lineHeight: '46px', border: 'none', borderRadius: 10, background: `var(--stg-raise,${COLORS.ink})`, color: `var(--stg-ink,${T.white})`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Swords size={14} strokeWidth={2.5} /> Challenge Someone
            </a>
            <div style={{ fontFamily: MONO, fontSize: 12, color: FADED, marginTop: 16, wordBreak: 'break-all' }}>{shareUrl}</div>
          </div>
        )}

        {/* ── JOIN ── */}
        {tab === 'join' && (
          <div><button onClick={() => setTab('play')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: `var(--stg-acc-ink,${COLORS.ember})`, padding: 0, marginBottom: 16 }}><ArrowLeft size={13} strokeWidth={2.5} /> Back to quiz</button>
          <JoinLeaderboardForm identity={identity} onJoined={(id) => { setIdentity(id); setTab('play'); }} onViewLeaderboard={() => setTab('stats')} /></div>
        )}

        {quiz.source && (
          <div style={{ marginTop: 40, paddingTop: 18, borderTop: `1px solid var(--stg-line,${COLORS.faded}33)`, fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em', color: FADED }}>
            Source:{' '}
            {typeof quiz.source === 'string'
              ? quiz.source
              : quiz.source.url
                ? <a href={quiz.source.url} target="_blank" rel="noopener noreferrer" style={{ color: `var(--stg-acc-ink,${COLORS.ember})` }}>{quiz.source.label}</a>
                : quiz.source.label}
          </div>
        )}


      </div>

      {qOpen && (
        <div onClick={() => setQOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(26,22,17,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6vh 16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: `var(--stg-surf,${COLORS.cream})`, borderRadius: 10, border: `2px solid var(--stg-line2,${COLORS.ink})`, padding: 24 }}>
            {qSent ? (
              <>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, margin: '0 0 10px' }}>Thanks, noted.</h3>
                <p style={{ fontFamily: SANS, fontSize: 15, color: FADED, margin: '0 0 20px' }}>Your question went to the editors' desk. We read every one.</p>
                <button onClick={() => { setQOpen(false); setQSent(false); setQMsg(''); setQName(''); setQEmail(''); }} style={{ cursor: 'pointer', background: `var(--stg-raise,${COLORS.ink})`, color: `var(--stg-ink,${COLORS.cream})`, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, padding: '12px 20px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>Close</button>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, margin: '0 0 6px' }}>Comments? Critique?</h3>
                <p style={{ fontFamily: SANS, fontSize: 14, color: FADED, margin: '0 0 14px' }}>Spot a city that's off, or something wrong with this quiz? Tell the editors.</p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <input type="text" value={qName} onChange={(e) => setQName(e.target.value)} maxLength={120} placeholder="Name (optional)" style={{ flex: 1, minWidth: 140, boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: INK, outline: 'none' }} />
                  <input type="email" value={qEmail} onChange={(e) => setQEmail(e.target.value)} maxLength={200} placeholder="Email (optional)" style={{ flex: 1, minWidth: 140, boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: INK, outline: 'none' }} />
                </div>
                <textarea value={qMsg} onChange={(e) => setQMsg(e.target.value)} maxLength={1000} rows={4} placeholder="What's your question or comment? (optional)" style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, background: `var(--stg-surf2,${COLORS.paper})`, fontFamily: SANS, fontSize: 14, color: INK, outline: 'none', resize: 'vertical', marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setQOpen(false)} style={{ cursor: 'pointer', background: 'transparent', color: INK, borderRadius: 10, border: `1.5px solid var(--stg-line2,${COLORS.ink})`, padding: '10px 18px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>Cancel</button>
                  <button onClick={submitQuestion} disabled={qBusy} style={{ cursor: 'pointer', background: COLORS.ember, color: T.white, borderRadius: 10, border: `1.5px solid var(--stg-acc,${COLORS.ember})`, padding: '10px 18px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, opacity: qBusy ? 0.6 : 1 }}>{qBusy ? 'Sending…' : 'Send to editors'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!QSTAGE && <Footer />}
    </div>
  );
}

function ghostBtn(disabled) {
  return { fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, padding: '10px 18px', background: 'transparent', color: `var(--stg-mute,${COLORS.faded})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}55)`, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 };
}

function StatBox({ label, value, accent }) {
  return (
    <div style={{ background: accent ? `var(--stg-surf2,${COLORS.paper})` : `var(--stg-surf2,${T.paper})`, borderRadius: 10, border: `1px solid var(--stg-line,${COLORS.faded}33)`, padding: '18px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 30, lineHeight: 1, color: accent ? `var(--stg-acc-ink,${COLORS.ember})` : `var(--stg-ink,${COLORS.ink})` }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: `var(--stg-mute,${COLORS.faded})`, marginTop: 8 }}>{label}</div>
    </div>
  );
}
