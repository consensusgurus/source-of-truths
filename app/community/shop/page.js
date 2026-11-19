import ShopClient from '../ShopClient';

// The shelf is Fourthwall's: this page reads the published products from the Storefront API once
// an hour and hands the client only what a card needs. The token is Fourthwall's public storefront
// token (read only). It is read from FOURTHWALL_STOREFRONT_TOKEN in the Vercel environment, because
// GitHub push protection refuses a commit that carries it. Without it the page shows its fallback card.
export const revalidate = 3600;

const API = 'https://storefront-api.fourthwall.com/v1';
const TOKEN = process.env.FOURTHWALL_STOREFRONT_TOKEN || '';

export const metadata = {
  title: 'Loft Shop | Mind Loft',
  description: 'Mind Loft tees, hoodies, hats and mugs for puzzle people. Made to order and shipped to you.',
  alternates: { canonical: '/community/shop' },
  openGraph: { title: 'Loft Shop · Mind Loft', description: 'Mind Loft tees, hoodies, hats and mugs for puzzle people. Made to order and shipped to you.', url: '/community/shop', type: 'website', siteName: 'Mind Loft' },
};

async function collection(slug) {
  if (!TOKEN) throw new Error('storefront token missing');
  const res = await fetch(`${API}/collections/${slug}/products?storefront_token=${TOKEN}&size=100`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`storefront ${slug} ${res.status}`);
  const json = await res.json();
  return Array.isArray(json.results) ? json.results : [];
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
    const [all, witty] = await Promise.all([collection('all'), collection('witty-ish').catch(() => null)]);
    const wittySlugs = witty ? new Set(witty.map((p) => p.slug)) : null;
    return all
      .filter((p) => p && p.slug && p.name && (!p.state || p.state.type === 'AVAILABLE'))
      .map((p) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const prices = variants.map((v) => v && v.unitPrice && v.unitPrice.value).filter((v) => typeof v === 'number');
        const colors = [...new Set(variants.map((v) => v && v.attributes && v.attributes.color && v.attributes.color.name).filter(Boolean))];
        const image = Array.isArray(p.images) && p.images[0] ? (p.images[0].transformedUrl || p.images[0].url) : null;
        const isWitty = wittySlugs ? wittySlugs.has(p.slug) : !p.name.startsWith('Mind Loft') || p.name.includes(' QR ');
        return {
          slug: p.slug,
          name: p.name,
          image,
          min: prices.length ? Math.min(...prices) : 0,
          max: prices.length ? Math.max(...prices) : 0,
          colors: colors.length,
          color: colors[0] || '',
          line: isWitty ? 'witty' : 'brand',
          kind: kindOf(p.name),
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
