import ReviewClient from './ReviewClient';
import { PHOTO_CSS } from '../photo-css';
import { isAdmin } from '@/lib/admin-auth';
import { allMeta } from '@/lib/photo-puzzles';

// /jigsaw/review: THE PHOTO REVIEW DESK (owner, 2026-11-27: "You approve each" photo before it
// shows on Community Photos). Admin cookie only. Waiting submissions first; every private link is
// listed too so any one can be turned off. Each submission also emails m@mindloftdaily.com.

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const metadata = { title: 'Photo Review | Mind Loft', robots: { index: false, follow: false } };

export default async function ReviewPage() {
  const ok = isAdmin();
  const items = ok ? (await allMeta().catch(() => [])).filter((m) => m.up).map((m) => ({
    code: m.code, name: m.name, by: m.by, w: m.w, h: m.h, max: m.max, pieces: m.pieces, status: m.status, submitted: !!m.submitted, topic: m.topic || '', slug: m.slug || '', at: m.at,
  })) : [];
  return (
    <div className="pz">
      <style dangerouslySetInnerHTML={{ __html: PHOTO_CSS }} />
      <div className="pz-in">
        <span className="pz-eyb">Admin</span>
        <h1>Community Photo Review</h1>
        {ok ? <ReviewClient items={items} /> : <p>Log in to <a href="/admin">admin</a> first, then come back to this page.</p>}
      </div>
    </div>
  );
}
