// /word-games/<set>: a puzzle set landing page (lib/puzzle-sets.js). Copy, roster
// and chrome all come from app/puzzle-category (see page-factory.js); this
// file only names the category.
import { setPages } from '../../puzzle-category/page-factory';

export const dynamic = 'force-dynamic';

const { generateMetadata, Page } = setPages('word-games');
export { generateMetadata };
export default Page;
