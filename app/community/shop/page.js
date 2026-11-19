import ShopClient from '../ShopClient';

// The shelf is Fourthwall's: this page reads the published products from the storefront's own public
// collection feeds (/collections/<slug>.json, no token, 20 a page, later pages at /collections/<slug>/<n>.json)
// once an hour and hands the client only what a card needs.
export const revalidate = 3600;

const SHOP = 'https://mindloft-shop.fourthwall.com';

export const metadata = {
  title: 'Loft Shop | Mind Loft',
  description: 'Mind Loft tees, hoodies, hats and mugs for puzzle people. Made to order and shipped to you.',
  alternates: { canonical: '/community/shop' },
  openGraph: { title: 'Loft Shop · Mind Loft', description: 'Mind Loft tees, hoodies, hats and mugs for puzzle people. Made to order and shipped to you.', url: '/community/shop', type: 'website', siteName: 'Mind Loft' },
};

async function collection(slug) {
  const out = [];
  const seen = new Set();
  for (let page = 1; page <= 8; page++) {
    const url = page === 1 ? `${SHOP}/collections/${slug}.json` : `${SHOP}/collections/${slug}/${page}.json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) { if (page === 1) throw new Error(`storefront ${slug} ${res.status}`); break; }
    const json = await res.json();
    const rows = Array.isArray(json.products) ? json.products : [];
    let fresh = 0;
    for (const p of rows) { if (p && p.handle && !seen.has(p.handle)) { seen.add(p.handle); out.push(p); fresh++; } }
    if (rows.length < 20 || fresh === 0) break;
  }
  return out;
}

function kindOf(name) {
  const n = name.toLowerCase();
  if (n.includes('hoodie')) return 'hoodie';
  if (n.includes('hat') || n.includes(' cap')) return 'hat';
  if (n.includes('mug')) return 'mug';
  return 'shirt';
}

async function loadProducts() {
  try {
    // 'shop-all' is a hand-ordered Fourthwall collection (owner, 2026-11-19: the Brain Fuel mug first, then
    // the light blue hat, never a khaki hat up front). Anything published but not yet filed in it follows,
    // in the storefront's own order.
    const [ordered, everything, witty] = await Promise.all([
      collection('shop-all').catch(() => []),
      collection('all'),
      collection('witty-ish').catch(() => null),
    ]);
    const filed = new Set(ordered.map((p) => p.handle));
    const all = [...ordered, ...everything.filter((p) => !filed.has(p.handle))];
    const wittySlugs = witty ? new Set(witty.map((p) => p.handle)) : null;
    return all
      .filter((p) => p && p.handle && p.title && p.available !== false)
      .map((p) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const prices = variants.map((v) => v && v.price && v.price.cents).filter((v) => typeof v === 'number').map((c) => c / 100);
        if (!prices.length && p.price && Number.isFinite(Number(p.price))) prices.push(Number(p.price));
        const colors = [...new Set(variants.map((v) => (v && typeof v.title === 'string' && v.title.includes(',') ? v.title.split(',')[0].trim() : '')).filter(Boolean))];
        const isWitty = wittySlugs ? wittySlugs.has(p.handle) : !p.title.startsWith('Mind Loft') || p.title.includes(' QR ');
        return {
          slug: p.handle,
          name: p.title,
          image: typeof p.image === 'string' ? p.image : null,
          min: prices.length ? Math.min(...prices) : 0,
          max: prices.length ? Math.max(...prices) : 0,
          colors: colors.length,
          color: colors[0] || '',
          line: isWitty ? 'witty' : 'brand',
          kind: kindOf(p.title),
        };
      });
  } catch (e) {
    return [];
  }
}

export default async function Page() {
  const products = await loadProducts();
  return <ShopClient products={products} />;
}
