// /end-game-puzzles: a puzzle category landing page. Copy, roster and chrome all come
// from app/puzzle-category (see page-factory.js); this file only names the slug.
import { categoryPage } from '../puzzle-category/page-factory';

export const dynamic = 'force-dynamic';

const { metadata, Page } = categoryPage('end-game-puzzles');
export { metadata };
export default Page;
