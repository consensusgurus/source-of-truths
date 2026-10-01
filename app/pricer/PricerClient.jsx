'use client';

// Pricer's client is the Price Check family engine (app/price/PriceGame.jsx,
// 2026-10-01). This file stays so the scoring exports keep their old home.
import PriceGame from '../price/PriceGame';

export { BANDS, SCORE_TABLE, errOf, bandOf, scoreOf, parseGuess } from '@/lib/price-games';

export default function PricerClient(props) {
  return <PriceGame game="pricer" {...props} />;
}
