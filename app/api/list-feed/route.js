// Public, read-only activity feed for a single list page (ActivityFeed.jsx).
// Anonymized streams; runs server-side with the service-role key.
//
// PRIVACY: manager notes are OFFLINE as of 2026-08-09. They came from
// `complaints`, which also stores private reader feedback and QR poster
// requests under synthetic list ids, so no public surface reads that table now.
// The manager stream is left wired up but always empty.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { LISTS } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Viewer-independent answer, so the CDN may hold it briefly (Vercel cost fix,
// 2026-10-27): repeat reads within the window never start a function.
const EDGE = { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' };


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = (searchParams.get('listId') || '').trim();
    if (!listId || listId.length > 100) {
      return NextResponse.json({ error: 'listId required' }, { status: 400 });
    }

    const list = LISTS.find((l) => l.id === listId);

    const [votesRes, managerRes, researchRes, commentsRes, seenRes, notesRes] = await Promise.all([
      Promise.resolve({ data: [] }), // vote_events removed (2026-06-18); votes return empty
      // Manager notes taken offline (2026-08-09); see app/feed/page.js. The
      // complaints table doubles as private feedback storage, so it no longer
      // feeds any public surface. Admin Notices remains the place to read it.
      Promise.resolve({ data: [] }),
      supabaseAdmin.from('consensus_alerts').select('item_name,change_type,rank,prev_rank,cause,detected_at').eq('list_id', listId).order('detected_at', { ascending: false }).limit(24),
      supabaseAdmin.from('list_comments').select('id,name,body,created_at,editor_response').eq('list_id', listId).eq('hidden', false).order('created_at', { ascending: false }).limit(60),
      supabaseAdmin.from('list_sources_seen').select('source_id,first_seen_at,label,removed_at,label_updated_at').eq('list_id', listId),
      supabaseAdmin.from('list_editor_notes').select('note,created_at').eq('list_id', listId).order('created_at', { ascending: false }).limit(20),
    ]);

    const votes = (votesRes.data || []).map((r) => ({ itemName: r.item_name, delta: r.delta, createdAt: r.created_at }));
    const manager = (managerRes.data || []).map((r) => ({ message: r.message, createdAt: r.created_at, editorResponse: (r.editor_response && r.editor_response.trim()) || null }));
    const researchAll = (researchRes.data || []).map((r) => ({ itemName: r.item_name, changeType: r.change_type, rank: r.rank, prevRank: r.prev_rank, cause: r.cause, detectedAt: r.detected_at }));
    // An unranked item entering the top 3 fires entered_top10 AND entered_top3
    // (both are research alerts); show the movement once.
    const t3Keys = new Set(researchAll.filter((r) => r.changeType === 'entered_top3').map((r) => `${(r.itemName || '').toLowerCase()}::${r.detectedAt}`));
    const research = researchAll.filter((r) => !(r.changeType === 'entered_top10' && t3Keys.has(`${(r.itemName || '').toLowerCase()}::${r.detectedAt}`)));
    const comments = (commentsRes.data || []).map((r) => ({ id: r.id, name: (r.name && r.name.trim()) || null, body: r.body, createdAt: r.created_at, editorResponse: (r.editor_response && r.editor_response.trim()) || null }));

    // Source tracking, stamped on view (no waiting for the daily cron). First
    // sighting backfills the whole current set to the list's creation date (the
    // launch batch); later additions are dated now() and show under "Research".
    // Labels are stored so a source can still be NAMED after it's removed, and
    // removed_at is set the first time a tracked source is gone from the list.
    const seenRows = seenRes.data || [];
    const seenMap = new Map(seenRows.map((r) => [r.source_id, r]));
    // Facts-mode lists keep their single real source in the ai slot (e.g.
    // Box Office Mojo), so include it for them; everywhere else ai is the
    // scoring-excluded consensus seed and stays hidden.
    const currentEntries = list && list.sources
      ? Object.entries(list.sources).filter(([id, s]) => (id !== 'ai' || list.mode === 'facts') && s && s.label)
      : [];
    const currentIds = new Set(currentEntries.map(([id]) => id));
    const created = list && (list.publishedAt || list.publishedDate);
    const initialIso = created && !isNaN(Date.parse(created)) ? new Date(created).toISOString() : new Date().toISOString();
    const nowIso = new Date().toISOString();
    const isInitial = seenRows.length === 0;

    const upserts = [];
    for (const [id, s] of currentEntries) {
      const row = seenMap.get(id);
      if (!row) {
        upserts.push({ list_id: listId, source_id: id, first_seen_at: isInitial ? initialIso : nowIso, label: s.label, removed_at: null, label_updated_at: null });
      } else if (row.label !== s.label || row.removed_at) {
        // A real label change (refresh/new edition) or a removed source
        // reappearing stamps label_updated_at -> a dated "Updated sources"
        // feed event. Backfilling a null stored label is silent.
        const realChange = (row.label != null && row.label !== s.label) || Boolean(row.removed_at);
        upserts.push({ list_id: listId, source_id: id, first_seen_at: row.first_seen_at, label: s.label, removed_at: null, label_updated_at: realChange ? nowIso : row.label_updated_at || null });
      }
    }
    for (const r of seenRows) {
      if (!currentIds.has(r.source_id) && r.removed_at == null) {
        upserts.push({ list_id: listId, source_id: r.source_id, first_seen_at: r.first_seen_at, label: r.label, removed_at: nowIso, label_updated_at: r.label_updated_at || null });
      }
    }
    if (upserts.length > 0) {
      try {
        await supabaseAdmin.from('list_sources_seen').upsert(upserts, { onConflict: 'list_id,source_id' });
        for (const u of upserts) seenMap.set(u.source_id, { ...(seenMap.get(u.source_id) || {}), ...u });
      } catch (_) {
        // non-fatal
      }
    }

    const fallback = created || null;
    const sources = [];
    for (const [id, s] of currentEntries) {
      const row = seenMap.get(id);
      sources.push({ id, label: s.label, trueExpert: Boolean(s.trueExpert), addedAt: (row && row.first_seen_at) || fallback, updatedAt: (row && row.label_updated_at) || null });
    }
    // Sources since REMOVED still belong in the history stream: they were
    // present at launch (or added later) and must keep showing in the
    // "N sources at launch" card (struck-through), with their dated
    // "Source removed" entry above. Without this, removing a launch source
    // retroactively shrank the launch card, contradicting the removal entry.
    for (const r of seenRows) {
      if (currentIds.has(r.source_id)) continue;
      sources.push({ id: r.source_id, label: r.label || r.source_id, trueExpert: false, addedAt: r.first_seen_at || fallback, updatedAt: r.label_updated_at || null, removed: true });
    }
    sources.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));

    // ONE-TIME suppression of the consensus-engine changeover artifacts. The
    // unordered-source flat-score formula in lib/helpers.js changed (678c223
    // June 3, ee84cdb June 4); the first cron run after it (June 5 ~11:00 UTC)
    // recomputed every list and logged boundary items as "entered top10" with
    // no real vote or source movement. Hide ONLY alerts detected on/before that
    // changeover. Every genuine consensus change AFTER it stays visible, even if
    // it predates a later source addition.
    const CHANGEOVER_CUTOFF = Date.parse('2026-06-05T12:00:00Z');
    const researchVisible = research.filter((r) => {
      if (r.cause === 'votes') return false;
      const t = r.detectedAt ? new Date(r.detectedAt).getTime() : 0;
      return t > CHANGEOVER_CUTOFF;
    });

    const removedSources = seenRows
      .filter((r) => !currentIds.has(r.source_id))
      .map((r) => { const cur = seenMap.get(r.source_id) || r; return { id: r.source_id, label: cur.label || r.label || r.source_id, removedAt: cur.removed_at || r.removed_at || nowIso }; })
      .sort((a, b) => new Date(b.removedAt || 0) - new Date(a.removedAt || 0));

    const editorNotes = (notesRes.data || []).map((r) => ({ note: r.note, createdAt: r.created_at }));
    return NextResponse.json({ votes, manager, research: researchVisible, comments, sources, editorNotes, removedSources }, { headers: EDGE });
  } catch (err) {
    console.error('list-feed error', err);
    return NextResponse.json({ votes: [], manager: [], research: [], comments: [], sources: [], editorNotes: [], removedSources: [] });
  }
}
