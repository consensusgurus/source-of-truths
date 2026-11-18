// GET /api/daily-answer?game=bot|peg&num=N: the stored answer for a board that
// is already live, for the Show the answer button (owner, 2026-11-18: "an
// option to show the answer for these newly published puzzles"). The game
// pages strip `sol` from the boards they send, so the answer is fetched only
// when a player asks for it, after their day is over. A board not yet live is
// a 404, so a future answer never leaves the server.
import { NextResponse } from 'next/server';
import { PUZZLES as BOT } from '@/app/bot/puzzles';
import { PUZZLES as PEG } from '@/app/peg/puzzles';

const BANKS = { bot: BOT, peg: PEG };

function etToday() {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}

export const dynamic = 'force-dynamic';

export function GET(req) {
  const u = new URL(req.url);
  const bank = BANKS[u.searchParams.get('game')];
  const num = Number(u.searchParams.get('num'));
  const p = bank && Number.isInteger(num) ? bank.find((x) => x.num === num) : null;
  if (!p || p.live > etToday()) return NextResponse.json({ error: 'not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ num: p.num, sol: p.sol }, { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
}
