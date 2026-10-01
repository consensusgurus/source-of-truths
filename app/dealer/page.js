import PricePage, { priceMetadata } from '../price/PricePage';
import { PUZZLES } from './puzzles';

// Dealer: one of the five Price Check family games (lib/price-games.js). The
// page is the family's shared server half (app/price/PricePage.jsx); the bank
// is ./puzzles.js, machine-checked by scripts/verify-price-banks.mjs.
export const metadata = priceMetadata('dealer');
export const dynamic = 'force-dynamic';

export default function Page({ searchParams }) {
  return <PricePage gameKey="dealer" PUZZLES={PUZZLES} searchParams={searchParams} />;
}
