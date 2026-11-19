'use client';
// Which of today's dailies this browser has a result on: the same-device
// breadcrumbs first (sot_<key>_day), then the server's answer for a player who
// finished on another device. Only used to label a discussion Open or locked;
// the route itself is what decides who can read.
import { useEffect, useState } from 'react';
import { DAY_ROSTER, etToday, fetchDayStatus } from '../useDayStats';

export function useDoneToday() {
  const [done, setDone] = useState(() => new Set());
  useEffect(() => {
    const today = etToday();
    const out = new Set();
    for (const k of DAY_ROSTER) {
      try {
        const c = JSON.parse(localStorage.getItem(`sot_${k}_day`) || 'null');
        if (c && c.d === today) out.add(k);
      } catch (e) { /* no storage */ }
    }
    setDone(new Set(out));
    const [Y, M, D] = today.split('-').map(Number);
    fetchDayStatus().then((data) => {
      if (!data) return;
      const ids = new Set([...(data.completed || []), ...(data.played || [])]);
      for (const k of DAY_ROSTER) if (ids.has(`${k}-${M}-${D}-${Y % 100}`)) out.add(k);
      setDone(new Set(out));
    });
  }, []);
  return done;
}
