import { PostFilters } from '@/lib/posts';

export function filtersToParams(filters: PostFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.pillar) params.set('pillar', filters.pillar);
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.status) params.set('status', filters.status);
  if (filters.service) params.set('service', filters.service);
  if (filters.location) params.set('location', filters.location);
  if (filters.lead) params.set('lead', filters.lead);
  if (filters.commercialPriority) params.set('priority', '1');
  if (filters.month) params.set('month', String(filters.month));
  if (filters.search) params.set('q', filters.search);
  return params;
}

export function paramsToFilters(params: URLSearchParams | ReadonlyURLSearchParams): PostFilters {
  const get = (k: string) => params.get(k) ?? undefined;
  const filters: PostFilters = {};
  const pillar = get('pillar');
  if (pillar) filters.pillar = pillar as PostFilters['pillar'];
  const platform = get('platform');
  if (platform) filters.platform = platform as PostFilters['platform'];
  const status = get('status');
  if (status) filters.status = status as PostFilters['status'];
  const service = get('service');
  if (service) filters.service = service as PostFilters['service'];
  const location = get('location');
  if (location) filters.location = location as PostFilters['location'];
  const lead = get('lead');
  if (lead) filters.lead = lead as PostFilters['lead'];
  if (get('priority') === '1') filters.commercialPriority = true;
  const month = get('month');
  if (month) filters.month = parseInt(month, 10);
  const q = get('q');
  if (q) filters.search = q;
  return filters;
}

interface ReadonlyURLSearchParams {
  get(name: string): string | null;
}
