'use client';
// A game's glyph on its CATEGORY's site pastel (owner, 2026-11-18: "why is
// every puzzle icon the same color and not matching category"). Light page:
// the ramp step 60/40 with white, the same pastel the home tiles wear (see
// "The site pastel is the 60/40 step" in docs/claude/home-and-ui.md). Dark
// page: a soft wash of the step, with the stage ink on top.
import React from 'react';
import GameGlyph from '../GameGlyph';
import { categoryColor } from '@/lib/category-ramp';
import { DAILY_GAME_MAP } from '@/lib/daily-games';

export default function GlyphTile({ gameKey, size = 38, glyph = 20 }) {
  const g = DAILY_GAME_MAP[gameKey];
  const hue = categoryColor(g ? g.cat : '');
  return (
    <span className="cm-glyph cm-gcat" style={{ '--gh': hue, width: size, height: size }} aria-hidden="true">
      <GameGlyph gameKey={gameKey} size={glyph} />
    </span>
  );
}
