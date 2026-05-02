'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Calendar, KanbanSquare, Star } from 'lucide-react';

const views = [
  { id: '', label: 'Timeline', icon: Calendar },
  { id: 'board', label: 'Board', icon: KanbanSquare },
  { id: 'priority', label: 'Priority', icon: Star },
];

export function ViewSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') ?? '';

  return (
    <div
      role="tablist"
      aria-label="Roadmap view"
      className="inline-flex rounded-xl border border-brand-deep/15 bg-white p-1"
    >
      {views.map((v) => {
        const Icon = v.icon;
        const active = currentView === v.id;
        const params = new URLSearchParams(searchParams.toString());
        if (v.id) {
          params.set('view', v.id);
        } else {
          params.delete('view');
        }
        return (
          <Link
            key={v.id || 'timeline'}
            href={`${pathname}?${params.toString()}`}
            role="tab"
            aria-selected={active}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-brand-deep text-white'
                : 'text-brand-deep hover:bg-brand-bg-soft',
            )}
          >
            <Icon size={14} />
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}
