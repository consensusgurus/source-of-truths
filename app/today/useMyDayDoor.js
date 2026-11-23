'use client';

// WHERE "BUILD YOUR DAY" GOES ONCE THERE IS A DAY (owner feedback, 2026-11-23:
// "when I build a run I'm not sure where I can see it? I don't see a 'my runs'
// section anywhere"). Every index door that read Build Your Day opens the
// reader's own paper, as "Mind Loft Daily", once a paper is saved on this
// device; with none it is still the invite to build one. Read after mount, so
// the server paint and the first client paint agree.
import { useEffect, useState } from 'react';
import { getMyDayItems } from '@/lib/daily-run';

export default function useMyDayDoor() {
  const [has, setHas] = useState(false);
  useEffect(() => {
    const read = () => setHas(getMyDayItems().length >= 2);
    read();
    const vis = () => { if (document.visibilityState === 'visible') read(); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, []);
  return has ? { href: '/my-day', label: 'Mind Loft Daily', has } : { href: '/build-a-run', label: 'Build Your Day', has };
}
