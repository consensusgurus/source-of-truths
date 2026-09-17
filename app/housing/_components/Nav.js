'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  ['/housing', 'Macro data'],
  ['/housing/health', 'Health checks'],
  ['/housing/models', 'Builder models'],
  ['/housing/share', 'Market share'],
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Housing Watch">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
