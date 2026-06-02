import Link from 'next/link';
import { ArrowRight, Star, MapPin, SlidersHorizontal, FileText, ShieldCheck } from 'lucide-react';
import { loadCampaign } from '@/lib/posts';
import { LinkButton } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const campaign = loadCampaign();

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
              The central planning tool for CES Medical&apos;s social media campaign. Every post,
              brief and production note — organised by week, pillar and platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/roadmap/" size="lg" variant="primary">
                Open the roadmap
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

      {/* How to use */}
      <section className="container-page py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="mb-3 font-display text-3xl font-semibold text-brand-deep">
            How to use this portal
          </h2>
          <p className="text-base text-muted">
            The roadmap is the main view. Everything else supports it.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Step
            number={1}
            icon={<MapPin size={20} />}
            title="Start with the roadmap"
            description="The timeline shows every post arranged by week. Scroll forward through the campaign to see what is coming up and when."
          />
          <Step
            number={2}
            icon={<SlidersHorizontal size={20} />}
            title="Understand the rationale before you execute"
            description="The roadmap starts with strategy: one core idea becomes one hero video, which feeds multiple platforms, which generates multiple short-form snippets. Read the strategy document first, then use the timeline to see how that logic plays out across the full campaign before scheduling or producing anything."
          />
          <Step
            number={3}
            icon={<FileText size={20} />}
            title="Open a card for the full brief"
            description="Click any post card to see the complete brief: caption, slide content, production notes, CTA and platform guidance."
          />
          <Step
            number={4}
            icon={<Star size={20} />}
            title="Use the Priority Board"
            description="Switch to the Priority Board to focus on the commercial-priority posts — the ones that drive consultations and conversions."
          />
          <Step
            number={5}
            icon={<ShieldCheck size={20} />}
            title="Check clinical review flags"
            description="Many posts carry a clinical review requirement in the production notes. Before any post is scheduled, confirm the review flag has been cleared and the status updated to approved."
          />
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-brand-deep/10">
        <div className="container-page py-12">
          <p className="text-sm font-medium uppercase tracking-wider text-muted mb-3">
            Content pillars
          </p>
          <p className="text-base text-brand-deep max-w-2xl">
            Educational, business, leadership, premises, employee, technology and events.
            Every post is tagged to one pillar — use the filter to move between them on the roadmap.
          </p>
        </div>
      </section>
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-deep/10 bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint-3 text-brand-teal">
          {icon}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted">
          Step {number}
        </span>
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold text-brand-deep">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}
