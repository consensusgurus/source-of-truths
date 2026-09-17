'use client';
// EVERYONE / <group> (owner, 2026-09-17, idea 3). The switch that narrows a
// board the reader already uses to one of their groups. It only renders for a
// reader in at least one group, and it remembers the last choice per browser,
// so a player who always checks their family board lands on it.
import { useEffect, useState } from 'react';

const KEY = 'sot_grp_scope';

export function useGroupScope(groups) {
  const [scope, setScope] = useState('all');
  useEffect(() => {
    if (!groups || !groups.length) return;
    let saved = 'all';
    try { saved = localStorage.getItem(KEY) || 'all'; } catch (e) {}
    if (saved !== 'all' && groups.some((g) => g.code === saved)) setScope(saved);
  }, [groups && groups.map((g) => g.code).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (v) => {
    setScope(v);
    try { localStorage.setItem(KEY, v); } catch (e) {}
  };
  const active = scope !== 'all' && groups ? groups.find((g) => g.code === scope) || null : null;
  return [active ? scope : 'all', choose, active];
}

export default function GroupSwitch({ groups, value, onChange, allLabel = 'Everyone', className = '' }) {
  if (!groups || !groups.length) return null;
  return (
    <div className={'gsw ' + className} role="group" aria-label="Which board">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <button type="button" aria-pressed={value === 'all'} onClick={() => onChange('all')}>{allLabel}</button>
      {groups.map((g) => (
        <button key={g.code} type="button" aria-pressed={value === g.code} onClick={() => onChange(g.code)}>{g.name}</button>
      ))}
    </div>
  );
}

const CSS = `
.gsw{display:flex;flex-wrap:wrap;gap:4px;margin:2px 0 10px;}
.gsw button{border:1px solid var(--stg-line2,rgba(255,255,255,.17));background:none;color:var(--stg-ink2,#aab5c7);
  border-radius:999px;padding:4px 11px;font:700 12px/1.3 Manrope,system-ui,sans-serif;cursor:pointer;
  max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.gsw button:hover{color:var(--stg-ink,#e9edf4);}
.gsw button[aria-pressed=true]{background:var(--stg-ink,#e9edf4);border-color:var(--stg-ink,#e9edf4);color:var(--stg-ground,#0b0f1a);}
.gsw button:focus-visible{outline:2px solid var(--stg-brand,#7dd3fc);outline-offset:2px;}
`;
