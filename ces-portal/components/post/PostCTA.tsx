import { Post } from '@/types/post';
import { buildUtmUrl } from '@/lib/utm';
import { Phone, ExternalLink, MessageCircle, Bookmark, Share2 } from 'lucide-react';

const ctaIcon = {
  phone: Phone,
  web: ExternalLink,
  dm: MessageCircle,
  save: Bookmark,
  share: Share2,
};

export function PostCTA({ post }: { post: Post }) {
  const Icon = ctaIcon[post.cta.type];
  const url = buildUtmUrl(post);

  return (
    <section
      aria-labelledby="cta-heading"
      className="rounded-xl border border-brand-teal/30 bg-brand-tint-3/40 p-5"
    >
      <h2 id="cta-heading" className="mb-3 font-display text-base font-semibold text-brand-deep">
        Call to action
      </h2>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-brand-deep">{post.cta.label}</p>
          {url && (
            <p className="mt-1 break-all font-mono text-xs text-muted">{url}</p>
          )}
          {post.cta.type === 'save' && (
            <p className="mt-1 text-xs text-muted">No outbound link · in-platform action</p>
          )}
          {post.cta.type === 'dm' && (
            <p className="mt-1 text-xs text-muted">In-platform direct message</p>
          )}
        </div>
      </div>
    </section>
  );
}
