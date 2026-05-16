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
  | 'medical-retina'
  | 'vitreoretinal'
  | 'corneal'
  | 'general'
  | 'brand';

export type Location =
  | 'chatham'
  | 'tunbridge-wells'
  | 'headcorn'
  | 'southborough'
  | 'pantiles';

export type Format = 'single-image' | 'carousel' | 'document-carousel' | 'reel' | 'story' | 'video' | 'text';

export type CtaType = 'phone' | 'web' | 'dm' | 'save' | 'share';

export type ProductionLead = 'leonna' | 'external' | 'stock';

export type VideoRelationship =
  | 'informed-by-interview'
  | 'direct-snippet'
  | 'leonna-premises'
  | 'patient-story'
  | 'no-video'
  | 'motion-design'
  | 'team-photography';

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

  videoRelationship?: VideoRelationship;
  videoReference?: string;
  linkedInAccount?: string;  // 'ces-brand' | 'elion-hyseni' | 'nick-kopsachilis' | 'kashif-qureshi' | 'syed-shahid'
  linkedInHook?: string;     // scroll-stopper first line (≤200 chars)

  clinicalReviewer?: string;
  brandReviewer?: string;
  approvedAt?: string;

  imageUrl?: string;
  images?: string[];
  notes?: string;
  tags?: string[];
  sortOrder?: number;
  roadmapId?: string;
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
  'medical-retina': 'Medical retina',
  vitreoretinal: 'Vitreoretinal surgery',
  corneal: 'Corneal surgery',
  general: 'General ophthalmology',
  brand: 'Brand',
};

export const LOCATION_LABELS: Record<Location, string> = {
  chatham: 'Chatham',
  'tunbridge-wells': 'Tunbridge Wells',
  headcorn: 'Headcorn',
  southborough: 'Southborough',
  pantiles: 'Pantiles',
};

export const VIDEO_RELATIONSHIP_LABELS: Record<VideoRelationship, string> = {
  'informed-by-interview':  'Informed by interview',
  'direct-snippet':         'Videography snippet (direct video use)',
  'leonna-premises':        'Leonna premises video',
  'patient-story':          'Patient story',
  'no-video':               'No video',
  'motion-design':          'Motion design',
  'team-photography':       'Team photography',
};

export const STATUS_ORDER: Status[] = [
  'draft',
  'clinical-review',
  'brand-review',
  'approved',
  'scheduled',
  'live',
];
