// The five crowd-scored dailies whose boards are re-scored live against their
// full puzzle (Outwit, Outrank, Feud, Herd, Poll). daily-combined and daily-me
// need these puzzles' CONTENT, so they import just these banks (about 1.3 MB)
// rather than lib/daily-slate.js and every bank on the site (2026-11-23).
import { PUZZLES as P_outwit } from '@/app/outwit/puzzles';
import { PUZZLES as P_outrank } from '@/app/outrank/puzzles';
import { PUZZLES as P_feud } from '@/app/feud/puzzles';
import { PUZZLES as P_herd } from '@/app/herd/puzzles';
import { PUZZLES as P_poll } from '@/app/poll/puzzles';

export const ADAPTIVE_PUZZLES = { outwit: P_outwit, outrank: P_outrank, feud: P_feud, herd: P_herd, poll: P_poll };
