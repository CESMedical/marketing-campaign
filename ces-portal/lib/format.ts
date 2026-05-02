import { Status } from '@/types/post';

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', opts ?? {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string): string {
  return formatDate(iso, { day: 'numeric', month: 'short' });
}

export function formatWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' });
}

export function getWeekRange(weekNumber: number, campaignStart: string): { start: string; end: string } {
  const start = new Date(campaignStart);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function getStatusTone(status: Status): 'neutral' | 'warning' | 'success' | 'info' {
  switch (status) {
    case 'draft':
      return 'neutral';
    case 'clinical-review':
    case 'brand-review':
      return 'warning';
    case 'approved':
    case 'scheduled':
      return 'info';
    case 'live':
      return 'success';
  }
}

export function pluralise(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : (plural ?? `${singular}s`);
}
