'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Forwards a person to the run, keeping any ?ref= the share carried.
export default function MathDoor({ to }) {
  const router = useRouter();
  useEffect(() => {
    let qs = '';
    try { qs = window.location.search || ''; } catch (e) {}
    router.replace(to + qs);
  }, [router, to]);
  return (
    <main style={{ minHeight: '100vh', background: '#0b0f1a', color: '#e9edf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <a href={to} style={{ color: '#7dd3fc', fontWeight: 700 }}>Opening the Math Gauntlet</a>
    </main>
  );
}
