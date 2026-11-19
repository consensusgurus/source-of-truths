import ShopClient from '../ShopClient';

export const metadata = {
  title: 'Loft Shop | Mind Loft',
  description: 'Mind Loft merchandise for puzzle people. Coming soon.',
  alternates: { canonical: '/community/shop' },
  openGraph: { title: 'Loft Shop · Mind Loft', description: 'Mind Loft merchandise for puzzle people. Coming soon.', url: '/community/shop', type: 'website', siteName: 'Mind Loft' },
};

export default function Page() {
  return <ShopClient />;
}
