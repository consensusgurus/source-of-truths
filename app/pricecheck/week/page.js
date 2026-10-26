import { WeekPage } from '../ShopWeek';

// /pricecheck/week (owner, 2026-10-25): the player's Price Check week, best
// five runs Monday to Sunday ET, graded on the shopper cards.
export const metadata = {
  title: 'Your Price Check Week | Mind Loft',
  description: 'Your weekly shopper card on Price Check: your best five runs from Monday to Sunday, the week by day, and the weekly board.',
  alternates: { canonical: '/pricecheck/week' },
  robots: { index: false, follow: true },
};
export const dynamic = 'force-dynamic';

export default function PriceCheckWeekPage() {
  return <WeekPage />;
}
