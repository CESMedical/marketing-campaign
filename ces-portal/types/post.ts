export type Pillar =
  | 'educational'
  | 'business'
  | 'premises'
  | 'employee'
  | 'leadership'
  | 'events'
  | 'tech';

export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'x';

export type Status =
  | 'draft'
  | 'clinical-review'
  | 'brand-review'
  | 'approved'
  | 'scheduled'
  | 'live';

export type Service =
  | 'cataract-monofocal'
  | 'cataract-multifocal'
  | 'cataract-edof'
  | 'cataract-toric'
  | 'oculoplastic-eyelid'
  | 'glaucoma'
  | 'dry-eye'
  | 'general'
  | 'brand';

export type Location =
  | 'pantiles'
  | 'chatham'
  | 'headcorn'
  | 'northfleet'
  | 'stock'
  | 'remote';

export type Format = 'single-image' | 'carousel' | 'reel' | 'story' | 'video' | 'text';

export type CtaType = 'phone' | 'web' | 'dm' | 'save' | 'share';

export type ProductionLead = 'leonna' | 'external' | 'stock';

export interface PostCta {
  label: string;
  type: CtaType;
  target?: string;
  utm?: string;
}

export interface PostAsset {
  type: 'image' | 'video' | 'carousel';
  placeholder?: string;
  notes?: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  pillar: Pillar;
  platforms: Platform[];
  status: Status;

  scheduledDate: string;
  weekNumber: number;

  isCommercialPriority: boolean;
  service?: Service;

  format: Format;
  caption: string;
  cta: PostCta;

  asset?: PostAsset;

  productionLocation?: Location;
  productionLead?: ProductionLead;

  clinicalReviewer?: string;
  brandReviewer?: string;
  approvedAt?: string;

  notes?: string;
  tags?: string[];
}

export interface Campaign {
  name: string;
  startDate: string;
  endDate: string;
  totalWeeks: number;
}

// Display labels for UI
export const PILLAR_LABELS: Record<Pillar, string> = {
  educational: 'Educational',
  business: 'Business / Service',
  premises: 'Premises',
  employee: 'Team & Patients',
  leadership: 'Leadership',
  events: 'Events',
  tech: 'Technology',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  x: 'X',
};

export const STATUS_LABELS: Record<Status, string> = {
  draft: 'Draft',
  'clinical-review': 'Clinical review',
  'brand-review': 'Brand review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  live: 'Live',
};

export const SERVICE_LABELS: Record<Service, string> = {
  'cataract-monofocal': 'Cataract — monofocal lens',
  'cataract-multifocal': 'Cataract — multifocal lens',
  'cataract-edof': 'Cataract — EDOF lens',
  'cataract-toric': 'Cataract — toric lens',
  'oculoplastic-eyelid': 'Oculoplastic — eyelid surgery',
  glaucoma: 'Glaucoma',
  'dry-eye': 'Dry eye',
  general: 'General ophthalmology',
  brand: 'Brand',
};

export const LOCATION_LABELS: Record<Location, string> = {
  pantiles: 'Pantiles',
  chatham: 'Chatham',
  headcorn: 'Headcorn',
  northfleet: 'Northfleet',
  stock: 'Stock / desk',
  remote: 'Remote',
};

export const STATUS_ORDER: Status[] = [
  'draft',
  'clinical-review',
  'brand-review',
  'approved',
  'scheduled',
  'live',
];
