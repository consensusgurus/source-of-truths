import { renderListCard } from '@/lib/og-stage-cards'
import { LISTS } from '@/lib/data'

export const runtime = 'nodejs';
export const alt = 'Mind Loft list preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function getItemName(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  return item.name || item.title || item.label || ''
}

// Borda scoring — mirrors lib/helpers.js getSources exactly.
function computeConsensus(list) {
  const sources = list.sources || {}
  const mode = list.mode || 'both'

  if (mode === 'facts' || mode === 'scores' || mode === 'unranked') {
    return (sources.ai && sources.ai.items ? sources.ai.items : []).slice(0, 10)
  }

  const publications = Object.entries(sources)
    .filter(([id]) => id !== 'ai')
    .map(([id, src]) => ({ id, items: src.items || [], unordered: src.unordered, weight: src.weight, trueExpert: src.trueExpert, rankedHead: src.rankedHead }))

  if (publications.length === 0) return sources.ai ? (sources.ai.items || []).slice(0, 10) : []

  const universeMap = {}
  publications.forEach(src => {
    src.items.forEach(item => {
      const name = getItemName(item)
      const key = name.toLowerCase().trim()
      if (key && !universeMap[key]) universeMap[key] = name
    })
  })

  const universe = Object.values(universeMap)
  if (universe.length === 0) return sources.ai ? (sources.ai.items || []).slice(0, 10) : []

  const scores = {}
  universe.forEach(item => { scores[item.toLowerCase().trim()] = 0 })

  const bordaFromRank = rank => (rank < 1 || rank > 10) ? 0 : 11 - rank
  // Unordered sources: budget = top-n slice of a ranked top-10
  // (n<=10: flat=(21-n)/2; n>10: flat=55/n). Kept in sync with lib/helpers.js.
  const FLAT_BUDGET = 55
  const flatUnordered = n => (n <= 0 ? 0 : n <= 10 ? (21 - n) / 2 : FLAT_BUDGET / n)

  // Source weighting — mirrors lib/helpers.js getSources. An explicit numeric
  // `weight` always takes precedence (even on a trueExpert source); otherwise a
  // trueExpert counts for max(2, N_other / 2) and a normal publication for 1.
  const normalWeightTotal = publications
    .filter(s => !s.trueExpert)
    .reduce((sum, s) => sum + (s.weight || 1), 0)
  const sourceWeight = src => {
    if (src.weight) return src.weight
    if (src.trueExpert) return Math.max(2, normalWeightTotal / 2)
    return 1
  }

  publications.forEach(src => {
    const w = sourceWeight(src)
    // Ranked-head source: first `rankedHead` items earn Borda rank points,
    // tail items earn the flat unordered score for the tail's size (mirrors
    // lib/helpers.js getSources).
    if (src.rankedHead) {
      const head = src.items.slice(0, src.rankedHead)
      const tail = src.items.slice(src.rankedHead)
      const flat = flatUnordered(tail.length)
      const pts = {}
      head.forEach((item, idx) => {
        const name = getItemName(item)
        if (name) pts[name.toLowerCase().trim()] = bordaFromRank(idx + 1)
      })
      tail.forEach(item => {
        const name = getItemName(item)
        if (name) pts[name.toLowerCase().trim()] = flat
      })
      universe.forEach(item => {
        const key = item.toLowerCase().trim()
        if (pts[key] !== undefined) scores[key] += pts[key] * w
      })
      return
    }
    if (src.unordered) {
      const listed = new Set(src.items.map(i => getItemName(i).toLowerCase().trim()))
      const flat = flatUnordered(listed.size)
      universe.forEach(item => {
        const key = item.toLowerCase().trim()
        if (listed.has(key)) scores[key] += flat * w
      })
      return
    }
    const pubRanks = {}
    src.items.forEach((item, idx) => {
      const name = getItemName(item)
      if (name) pubRanks[name.toLowerCase().trim()] = idx + 1
    })
    universe.forEach(item => {
      const key = item.toLowerCase().trim()
      if (pubRanks[key] !== undefined) scores[key] += bordaFromRank(pubRanks[key]) * w
    })
  })

  const appearanceCount = {}
  universe.forEach(item => {
    const key = item.toLowerCase().trim()
    appearanceCount[key] = publications.reduce((n, src) => {
      return n + (src.items.some(i => getItemName(i).toLowerCase().trim() === key) ? 1 : 0)
    }, 0)
  })

  const consensusItems = [...universe].sort((a, b) => {
    const ka = a.toLowerCase().trim()
    const kb = b.toLowerCase().trim()
    if (scores[kb] !== scores[ka]) return scores[kb] - scores[ka]
    if (appearanceCount[kb] !== appearanceCount[ka]) return appearanceCount[kb] - appearanceCount[ka]
    return a.localeCompare(b)
  }).slice(0, 10)

  // Backfill to 10 from the `ai` seed — kept in sync with lib/helpers.js.
  if (consensusItems.length < 10) {
    const present = new Set(consensusItems.map(i => i.toLowerCase().trim()))
    const seed = (sources.ai && sources.ai.items) || []
    for (const seedItem of seed) {
      if (consensusItems.length >= 10) break
      const name = getItemName(seedItem)
      const key = name.toLowerCase().trim()
      if (!present.has(key)) {
        consensusItems.push(name)
        present.add(key)
      }
    }
  }

  return consensusItems
}

async function renderCard({ params }) {
  const list = LISTS.find(l => l.id === params.id)
  if (!list) {
    return renderListCard({ id: params.id, title: 'Mind Loft', category: 'Mind Loft', previewItems: [], startPosition: 10, isUnranked: false })
  }
  const isUnranked = (list.mode || 'both') === 'unranked'
  const consensusItems = computeConsensus(list)
  const sliced = isUnranked ? consensusItems.slice(0, 5) : consensusItems.slice(5, 10)
  const previewItems = (isUnranked ? sliced : sliced.slice().reverse()).map(getItemName)
  const startPosition = isUnranked ? 5 : 5 + sliced.length
  return renderListCard({ id: list.id, title: list.title, category: list.category || 'Top 10', previewItems, startPosition, isUnranked })
}


// A Satori render that throws used to surface as a 500, which is how these
// routes became every one of Search Console's server errors. Fall back to the
// baked card in public/og/ instead: a generic share image beats an error.
export default async function Image(ctx) {
  try {
    return await renderCard(ctx);
  } catch (err) {
    console.error('share card failed, serving /og/lists.png', err);
    return new Response(null, { status: 302, headers: { Location: '/og/lists.png' } });
  }
}
