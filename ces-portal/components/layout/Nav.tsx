'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import { Clock } from 'lucide-react';

const links = [
  { href: '/',                       label: 'Overview',      exact: true,  view: null },
  { href: '/roadmap',                label: 'Roadmap',       exact: false, view: '' },
  { href: '/roadmap/?view=priority', label: 'Priority Board',exact: false, view: 'priority' },
  { href: '/about',                  label: 'About',         exact: false, view: null },
];

function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') ?? '';
  const isActivity = pathname.startsWith('/activity');

  return (
    <ul className="flex items-center gap-1 sm:gap-2">
      {links.map((link) => {
        const linkPath = link.href.split('?')[0];
        const pathMatch = link.exact ? pathname === linkPath : pathname.startsWith(linkPath);
        const active = link.view === null
          ? pathMatch
          : pathMatch && currentView === link.view;
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

      {/* Activity feed — last icon */}
      <li>
        <Link
          href="/activity/"
          title="Recent activity"
          aria-label="Recent activity"
          className={clsx(
            'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
            isActivity
              ? 'text-brand-teal'
              : 'text-brand-deep/50 hover:text-brand-teal hover:bg-brand-bg-soft',
          )}
        >
          <Clock size={18} />
        </Link>
      </li>
    </ul>
  );
}

export function Nav() {
  return (
    <nav aria-label="Primary">
      <Suspense fallback={
        <ul className="flex items-center gap-1 sm:gap-2">
          {links.map(link => (
            <li key={link.href}>
              <Link href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-brand-deep">
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <span className="flex items-center justify-center w-9 h-9 rounded-lg text-brand-deep/50">
              <Clock size={18} />
            </span>
          </li>
        </ul>
      }>
        <NavLinks />
      </Suspense>
    </nav>
  );
}
