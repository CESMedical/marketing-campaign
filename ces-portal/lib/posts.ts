import postsData from '@/content/posts.json';
import campaignData from '@/content/campaign.json';
import {
  Post,
  Campaign,
  Pillar,
  Platform,
  Status,
  Service,
  Location,
  ProductionLead,
  STATUS_ORDER,
} from '@/types/post';

export function loadPosts(): Post[] {
  return postsData as Post[];
}

export function loadCampaign(): Campaign {
  return campaignData as Campaign;
}

export function getPostBySlug(slug: string): Post | undefined {
  return loadPosts().find((p) => p.slug === slug);
}

export function getPostById(id: string): Post | undefined {
  return loadPosts().find((p) => p.id === id);
}

export interface PostFilters {
  pillar?: Pillar;
  platform?: Platform;
  status?: Status;
  service?: Service;
  location?: Location;
  lead?: ProductionLead;
  commercialPriority?: boolean;
  month?: number; // 5, 6, 7
  search?: string;
}

export function filterPosts(posts: Post[], filters: PostFilters): Post[] {
  return posts.filter((post) => {
    if (filters.pillar && post.pillar !== filters.pillar) return false;
    if (filters.platform && !post.platforms.includes(filters.platform)) return false;
    if (filters.status && post.status !== filters.status) return false;
    if (filters.service && post.service !== filters.service) return false;
    if (filters.location && post.productionLocation !== filters.location) return false;
    if (filters.lead && post.productionLead !== filters.lead) return false;
    if (filters.commercialPriority && !post.isCommercialPriority) return false;
    if (filters.month) {
      const m = new Date(post.scheduledDate).getMonth() + 1;
      if (m !== filters.month) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${post.title} ${post.caption} ${post.id}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function groupByWeek(posts: Post[]): Map<number, Post[]> {
  const map = new Map<number, Post[]>();
  for (const post of posts) {
    const list = map.get(post.weekNumber) ?? [];
    list.push(post);
    map.set(post.weekNumber, list);
  }
  // Sort each week's posts by date
  for (const list of map.values()) {
    list.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }
  return map;
}

export function groupByStatus(posts: Post[]): Map<Status, Post[]> {
  const map = new Map<Status, Post[]>();
  for (const status of STATUS_ORDER) {
    map.set(status, []);
  }
  for (const post of posts) {
    map.get(post.status)?.push(post);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }
  return map;
}

export function groupByService(posts: Post[]): Map<Service, Post[]> {
  const map = new Map<Service, Post[]>();
  for (const post of posts) {
    const key = post.service ?? 'general';
    const list = map.get(key) ?? [];
    list.push(post);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }
  return map;
}

export function getCommercialPriority(posts: Post[]): Post[] {
  return posts.filter((p) => p.isCommercialPriority);
}

export function getAdjacentPosts(slug: string): {
  prev?: Post;
  next?: Post;
} {
  const all = loadPosts().slice().sort((a, b) =>
    a.scheduledDate.localeCompare(b.scheduledDate),
  );
  const idx = all.findIndex((p) => p.slug === slug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? all[idx - 1] : undefined,
    next: idx < all.length - 1 ? all[idx + 1] : undefined,
  };
}
