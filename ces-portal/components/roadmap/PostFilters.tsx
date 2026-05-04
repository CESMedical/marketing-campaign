'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import {
  Pillar,
  Platform,
  Status,
  Service,
  Location,
  ProductionLead,
  PILLAR_LABELS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  SERVICE_LABELS,
  LOCATION_LABELS,
  STATUS_ORDER,
} from '@/types/post';
import { X } from 'lucide-react';

type FilterKey =
  | 'pillar'
  | 'platform'
  | 'status'
  | 'service'
  | 'location'
  | 'lead'
  | 'priority'
  | 'view';

const PILLARS: Pillar[] = [
  'educational',
  'business',
  'premises',
  'employee',
  'leadership',
  'events',
  'tech',
];

const PLATFORMS: Platform[] = ['instagram', 'facebook', 'linkedin', 'youtube', 'x'];

const SERVICES: Service[] = [
  'cataract-monofocal',
  'cataract-multifocal',
  'cataract-edof',
  'cataract-toric',
  'oculoplastic-eyelid',
  'glaucoma',
  'dry-eye',
  'general',
  'brand',
];

const LOCATIONS: Location[] = ['chatham', 'tunbridge-wells', 'headcorn'];

const LEADS: ProductionLead[] = ['leonna', 'external', 'stock'];

export function PostFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateFilter = (key: FilterKey, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    const view = searchParams.get('view');
    if (view) params.set('view', view);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const activeCount = ['pillar', 'platform', 'status', 'service', 'location', 'lead', 'priority']
    .filter((k) => searchParams.get(k))
    .length;

  return (
    <div className="sticky top-16 z-30 border-b border-brand-deep/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-page py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Pillar"
            value={searchParams.get('pillar') ?? ''}
            options={PILLARS.map((p) => ({ value: p, label: PILLAR_LABELS[p] }))}
            onChange={(v) => updateFilter('pillar', v || undefined)}
          />
          <Select
            label="Platform"
            value={searchParams.get('platform') ?? ''}
            options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))}
            onChange={(v) => updateFilter('platform', v || undefined)}
          />
          <Select
            label="Status"
            value={searchParams.get('status') ?? ''}
            options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            onChange={(v) => updateFilter('status', v || undefined)}
          />
          <Select
            label="Service"
            value={searchParams.get('service') ?? ''}
            options={SERVICES.map((s) => ({ value: s, label: SERVICE_LABELS[s] }))}
            onChange={(v) => updateFilter('service', v || undefined)}
          />
          <Select
            label="Location"
            value={searchParams.get('location') ?? ''}
            options={LOCATIONS.map((l) => ({ value: l, label: LOCATION_LABELS[l] }))}
            onChange={(v) => updateFilter('location', v || undefined)}
          />
          <Select
            label="Lead"
            value={searchParams.get('lead') ?? ''}
            options={LEADS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }))}
            onChange={(v) => updateFilter('lead', v || undefined)}
          />

          <label className="ml-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-deep/15 px-3 py-1.5 text-sm font-medium text-brand-deep hover:border-brand-deep/40">
            <input
              type="checkbox"
              checked={searchParams.get('priority') === '1'}
              onChange={(e) => updateFilter('priority', e.target.checked ? '1' : undefined)}
              className="accent-brand-teal"
            />
            Commercial priority only
          </label>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-brand-bg-soft hover:text-brand-deep"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-brand-deep/15 bg-white px-2.5 py-1.5 text-sm text-brand-deep focus-visible:border-brand-teal focus-visible:outline-none"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
