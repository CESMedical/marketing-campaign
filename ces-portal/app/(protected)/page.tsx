import Link from 'next/link';
import { ArrowRight, Star, Calendar, Layers } from 'lucide-react';
import { loadCampaign, getCommercialPriority } from '@/lib/posts';
import { loadPostsData } from '@/lib/post-data';
import { LinkButton } from '@/components/ui/Button';
import { Logo } from '@/components/brand/Logo';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const campaign = loadCampaign();
  const posts = await loadPostsData();
  const priority = getCommercialPriority(posts);

  // Calculate weeks remaining (or campaign complete)
  const today = new Date();
  const end = new Date(campaign.endDate);
  const weeksRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7)),
  );
  const campaignComplete = today > end;

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-deep text-white">
        <div className="container-page py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-brand-tint-2">
              Campaign roadmap
            </p>
            <h1 className="mb-6 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {campaign.name}
            </h1>
            <p className="mb-8 text-lg text-white/85 sm:text-xl">
              An interactive view of the next three months of CES Medical&apos;s social campaign —
              48 posts across cataract, oculoplastic, and brand pillars.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/roadmap/" size="lg" variant="primary">
                View the roadmap
                <ArrowRight size={16} />
              </LinkButton>
              <Link
                href="/roadmap/?view=priority"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-base font-medium text-white hover:bg-white/10"
              >
                <Star size={16} />
                Priority Board
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KPI tiles */}
      <section aria-labelledby="kpi-heading" className="border-b border-brand-deep/10">
        <div className="container-page py-12">
          <h2 id="kpi-heading" className="sr-only">
            Campaign at a glance
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiTile
              icon={<Layers size={20} />}
              label="Total posts"
              value={posts.length}
              hint="Across 13 weeks"
            />
            <KpiTile
              icon={<Star size={20} />}
              label="Commercial priority"
              value={priority.length}
              hint="Conversion-focused"
            />
            <KpiTile
              icon={<Calendar size={20} />}
              label={campaignComplete ? 'Status' : 'Weeks remaining'}
              value={campaignComplete ? '✓' : weeksRemaining}
              hint={campaignComplete ? 'Campaign complete' : 'Until 31 July'}
            />
          </div>
        </div>
      </section>

      {/* Pillars summary */}
      <section className="container-page py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="mb-4 font-display text-3xl font-semibold text-brand-deep">
            Built around the seven content pillars
          </h2>
          <p className="text-base text-muted">
            Educational, business, premises, team, leadership, events, and technology.
            Together they balance trust-building, awareness, and conversion across the campaign.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Logo variant="mark" className="h-8 w-auto" />
          <p className="text-sm italic text-muted">Global Care for Local People</p>
        </div>
      </section>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-deep/10 bg-white p-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint-3 text-brand-teal">
        {icon}
      </div>
      <p className="mb-1 text-sm font-medium text-muted">{label}</p>
      <p className="font-display text-4xl font-semibold text-brand-deep">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
