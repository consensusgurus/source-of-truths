// What the browser is allowed to see of one Price Check family day, in the one
// shape app/price/PriceGame.jsx draws. Each game's bank keeps its own fields;
// this turns a row into the item card: photos, the eyebrow, the title, the
// facts, the one line under them, the "as of" sentence and the link. It is a
// WHITELIST, so a new authoring field stays on the server until it is added
// here on purpose. The price ships because the reveal needs it; tomorrow's
// row never does, because the page only ever ships the picked day.
import { fmtIsoDate } from './price-games.js';

const DOW = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
const MD = (iso) => fmtIsoDate(iso, { year: undefined });
const MDY = (iso) => fmtIsoDate(iso);

// Realtor photos are a listing's own, and a listing's photos do not stay put:
// the agent re-uploads (Redfin bumps the filename's version suffix and deletes
// the old file), the home sells, or it is pulled. Hotlinking them broke the
// Raleigh board on 2026-10-13. So a Realtor photo is ALWAYS served through
// /api/realtor/img, which caches the bytes and walks the version suffix when
// the banked URL has gone. scripts/verify-price-banks.mjs fails a bank whose
// item card hotlinks a listing photo directly.
export function realtorImg(num, i) {
  return `/api/realtor/img?n=${num}&i=${i}`;
}

// A listing's own-currency asking price, whole units (GBP 895,000 -> "£895,000").
export function fmtLocal(minor, cur) {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Math.round(minor / 100)); }
  catch (e) { return `${Math.round(minor / 100).toLocaleString('en-US')} ${cur}`; }
}

export function shipFor(key, p) {
  const asOfDay = MDY(p.gathered);
  const base = { price: p.price, credit: p.credit || null, creditUrl: p.creditUrl || null };
  if (key === 'pricer') {
    return {
      ...base, name: p.name, cat: p.cat, imgs: [{ src: p.img }], fit: 'contain', facts: [],
      line: 'Sold on Amazon', asOfShort: `pricing as of ${asOfDay}`,
      asOf: `Pricing as of ${asOfDay}: the price Amazon showed that day. It may have moved since.`,
      href: p.href, buy: 'See it on Amazon', sponsored: true,
    };
  }
  if (key === 'dealer') {
    return {
      ...base, name: p.name, cat: p.cat, imgs: [{ src: p.img }], fit: 'cover', facts: ['Base trim', 'Starting MSRP'],
      line: `Priced on ${p.maker}`, asOfShort: `as of ${asOfDay}`,
      asOf: `Starting MSRP on ${p.maker} as of ${asOfDay}, before destination, taxes and options. The photo may show a higher trim.`,
      href: p.href, buy: `See it on ${p.maker}`, sponsored: false,
    };
  }
  if (key === 'realtor') {
    const ba = Number.isInteger(p.baths) ? p.baths : p.baths;
    const facts = [`${p.beds} bd`, `${ba} ba`, `${Number(p.sqft).toLocaleString('en-US')} sq ft`];
    if (p.year) facts.push(`Built ${p.year}`);
    // REALTOR GOES GLOBAL (owner, 2026-10-25). A home outside the US carries
    // `country` (and no US state when it has none), `local` (the asking price
    // in the listing's own currency, integer minor units) and `fx` (US dollars
    // per one unit on the day it was read). The player still guesses in US
    // dollars; the reveal names the local asking price beside it. `via` names
    // the listing site the photos came from (Redfin unless it says otherwise).
    const abroad = p.country && p.country !== 'US' ? p.country : '';
    const where = p.state ? `${p.city}, ${p.state}${abroad ? `, ${abroad}` : ''}` : `${p.city}, ${abroad}`;
    // US and Canada: "Street, City, ST ZIP"; elsewhere the postcode follows the
    // town with no comma ("Sparsholt Road, London N19, UK").
    const place = p.state ? `${p.city}, ${`${p.state} ${p.zip || ''}`.trim()}` : `${p.city}${p.zip ? ` ${p.zip}` : ''}`;
    const local = p.local && p.local.cur && p.local.cur !== 'USD' ? fmtLocal(p.local.amount, p.local.cur) : null;
    return {
      ...base, name: `A home in ${where}`, hideName: true,
      revealName: `${p.address}, ${place}${abroad ? `, ${abroad}` : ''}`,
      cat: 'Home for sale', imgs: [0, 1, 2].map((i) => ({ src: realtorImg(p.num, i), label: ['Curb', 'Kitchen', 'Inside'][i] })),
      fit: 'cover', facts, line: 'Listed for sale', asOfShort: `asking price as of ${asOfDay}`,
      asOf: local
        ? `Listed at ${local}, shown in US dollars at that day's rate. Asking price as of ${asOfDay}; asking prices change, and this one may have since.`
        : `Asking price as of ${asOfDay}, as listed. Asking prices change, and this one may have since.`,
      local,
      href: p.href, buy: 'See the listing', sponsored: false,
      credit: `Listing photos: ${p.broker}, via ${p.via || 'Redfin'}.`, creditUrl: p.href,
    };
  }
  if (key === 'agent') {
    if (p.kind === 'hotel') {
      return {
        ...base, name: p.hotel, cat: 'Hotel stay', imgs: [{ src: p.img }], fit: 'cover',
        facts: [p.room, `Check in ${DOW(p.date)}, ${MD(p.date)}`, `${p.nights} night${p.nights === 1 ? '' : 's'}`, '2 adults'],
        line: p.city, asOfShort: `quoted ${asOfDay}`,
        asOf: `The nightly rate with taxes and fees as quoted on Google Hotels on ${asOfDay}. Rates change by the day.`,
        href: p.href, buy: 'See the hotel', sponsored: false,
      };
    }
    return {
      ...base, name: `${p.airline} · ${p.from} to ${p.to}`, cat: 'Flight', imgs: [{ src: p.img }], fit: 'cover',
      facts: [p.cabin, `${DOW(p.date)}, ${MD(p.date)}`, `Departs ${p.dep}`, 'Nonstop', 'One way'],
      line: `${p.fromCity} to ${p.toCity}`, asOfShort: `quoted ${asOfDay}`,
      asOf: `The one-way fare for one adult, taxes and fees in, as quoted on Google Flights on ${asOfDay}. Fares change by the hour.`,
      href: p.href, buy: 'Search this flight', sponsored: false,
    };
  }
  if (key === 'curator') {
    if (p.kind === 'auction') {
      return {
        ...base, name: p.name, cat: 'Sold at auction', imgs: [{ src: p.img }], fit: 'contain',
        facts: [`${p.maker}, ${p.year}`, `${p.house}, ${p.place}`, MDY(p.sale)],
        line: 'With buyer\'s premium', asOfShort: `sold ${MDY(p.sale)}`,
        asOf: `Sold at ${p.house} ${p.place} on ${MDY(p.sale)}, buyer's premium included.`,
        href: p.href, buy: 'Read about the sale', sponsored: false,
      };
    }
    return {
      ...base, name: p.name, cat: 'Luxury, list price', imgs: [{ src: p.img }], fit: 'contain',
      facts: [p.brand, 'New, at retail'], line: `Priced on ${p.site}`, asOfShort: `as of ${asOfDay}`,
      asOf: `List price on ${p.site} as of ${asOfDay}, before tax.`,
      href: p.href, buy: `See it on ${p.site}`, sponsored: false,
    };
  }
  return null;
}
