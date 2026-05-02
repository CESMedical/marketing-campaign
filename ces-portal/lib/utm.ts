import { Post } from '@/types/post';

/**
 * Build a UTM-tagged URL for a post's CTA target.
 * If the post already has a utm string defined, append it; otherwise build one.
 */
export function buildUtmUrl(post: Post): string | undefined {
  const target = post.cta.target;
  if (!target || !target.startsWith('http')) return target;

  if (post.cta.utm) {
    const sep = target.includes('?') ? '&' : '?';
    return `${target}${sep}${post.cta.utm}`;
  }

  const params = new URLSearchParams({
    utm_source: 'social',
    utm_medium: post.platforms[0] ?? 'social',
    utm_campaign: 'may-jul-2026',
    utm_content: post.id,
  });
  const sep = target.includes('?') ? '&' : '?';
  return `${target}${sep}${params.toString()}`;
}
