import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { loadPosts, getPostBySlug, getAdjacentPosts } from '@/lib/posts';
import { PostHero } from '@/components/post/PostHero';
import { PostTimeline } from '@/components/post/PostTimeline';
import { PostCTA } from '@/components/post/PostCTA';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return loadPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.id} — ${post.title} | CES Roadmap`,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);

  return (
    <article className="container-page py-8 sm:py-12">
      <Link
        href="/roadmap/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-brand-deep"
      >
        <ArrowLeft size={14} />
        Back to roadmap
      </Link>

      <PostHero post={post} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section aria-labelledby="caption-heading" className="mb-8">
            <h2
              id="caption-heading"
              className="mb-3 font-display text-base font-semibold text-brand-deep"
            >
              Caption
            </h2>
            <div className="rounded-xl border border-brand-deep/10 bg-white p-5">
              <p className="whitespace-pre-line text-base leading-relaxed text-brand-ink">
                {post.caption}
              </p>
            </div>
          </section>

          {post.notes && (
            <section aria-labelledby="notes-heading" className="mb-8">
              <h2
                id="notes-heading"
                className="mb-3 font-display text-base font-semibold text-brand-deep"
              >
                Production notes
              </h2>
              <div className="rounded-xl bg-brand-bg-soft p-5">
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-deep">
                  {post.notes}
                </p>
              </div>
            </section>
          )}

          <section aria-labelledby="meta-heading">
            <h2
              id="meta-heading"
              className="mb-3 font-display text-base font-semibold text-brand-deep"
            >
              Metadata
            </h2>
            <dl className="grid gap-3 rounded-xl border border-brand-deep/10 bg-white p-5 sm:grid-cols-2">
              <MetaRow label="Format" value={post.format} />
              <MetaRow label="Week" value={`Week ${post.weekNumber}`} />
              {post.clinicalReviewer && (
                <MetaRow label="Clinical reviewer" value={post.clinicalReviewer} />
              )}
              {post.brandReviewer && (
                <MetaRow label="Brand reviewer" value={post.brandReviewer} />
              )}
              {post.tags && post.tags.length > 0 && (
                <MetaRow label="Tags" value={post.tags.join(', ')} />
              )}
            </dl>
          </section>
        </div>

        <aside className="space-y-6">
          <PostCTA post={post} />
          <PostTimeline status={post.status} />
        </aside>
      </div>

      <nav
        aria-label="Adjacent posts"
        className="mt-12 grid gap-3 border-t border-brand-deep/10 pt-8 sm:grid-cols-2"
      >
        {prev ? (
          <Link
            href={`/post/${prev.slug}/`}
            className="group rounded-xl border border-brand-deep/10 p-4 hover:border-brand-teal"
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-muted">
              <ArrowLeft size={12} />
              Previous
            </div>
            <p className="text-sm font-medium text-brand-deep group-hover:text-brand-teal">
              {prev.id} · {prev.title}
            </p>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/post/${next.slug}/`}
            className="group rounded-xl border border-brand-deep/10 p-4 text-right hover:border-brand-teal"
          >
            <div className="mb-1 flex items-center justify-end gap-2 text-xs text-muted">
              Next
              <ArrowRight size={12} />
            </div>
            <p className="text-sm font-medium text-brand-deep group-hover:text-brand-teal">
              {next.id} · {next.title}
            </p>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium capitalize text-brand-deep">{value}</dd>
    </div>
  );
}
