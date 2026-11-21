import { NextResponse } from 'next/server';
import { pastJigsaws } from '@/lib/jigsaw-library';
import { fitAll } from '@/lib/jigsaw-fit';

// /api/jigsaw/fit   (GET)  ->  { max: { 'jig-12': 2000, 'saw-3': 1000, ... } }
//
// The biggest piece count each past Jig and Saw photo can be played at on the
// jigsaw portal (/jig/shelf); bigger sizes are greyed there (owner, 2026-11-21).
// Worked out in lib/jigsaw-fit.js from each Commons original's size and the
// detail in its thumbnail. Today's photos are never in it. Edge-cached for a
// day; the photos and their sizes sit in the data cache, so a fresh deploy only
// re-measures what it has not seen.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const max = await fitAll(pastJigsaws());
    // A run where some photos could not be measured is cached briefly, so a
    // Commons hiccup does not grey (or ungrey) pictures for a whole day.
    const cc = max.partial ? 'public, max-age=60, s-maxage=600' : 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
    return NextResponse.json({ max }, { headers: { 'Cache-Control': cc } });
  } catch (e) {
    console.error('jigsaw fit', e);
    return NextResponse.json({ max: {} }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } });
  }
}
