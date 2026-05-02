'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/roadmap/?view=priority', label: 'Priority Board' },
  { href: '/about', label: 'About' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary">
      <ul className="flex items-center gap-1 sm:gap-2">
        {links.map((link) => {
          const linkPath = link.href.split('?')[0];
          const active = linkPath === '/' ? pathname === '/' : pathname.startsWith(linkPath);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-brand-teal'
                    : 'text-brand-deep hover:text-brand-teal hover:bg-brand-bg-soft',
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
