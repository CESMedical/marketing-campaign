import { Pillar, PILLAR_LABELS } from '@/types/post';
import { Check } from 'lucide-react';

const pillarDescriptions: Record<Pillar, string> = {
  educational:
    'Valuable insights and how-to guides on eye health and the conditions CES treats. Builds authority and answers the questions patients actually ask.',
  business:
    'Service explainers, lens packages, insurance pathways, and direct calls to action — the engine of conversion across the campaign.',
  premises:
    'Clinics, theatres, and what they look like from the inside. Trust and transparency through showing rather than telling.',
  employee:
    'Real patients, in their own words. Team members, day-in-the-life moments, the human side of consultant-led care.',
  leadership:
    'Founder messages and consultant insights. The voice of CES on industry direction, values, and how decisions get made.',
  events:
    'Conference appearances, community events, open days, and post-event recaps. Extending reach beyond the feed.',
  tech: 'New procedures, equipment, and capabilities. Positioning CES as forward-looking without losing the local feel.',
};

const compliance = [
  'Patient consent — written, specific consent on file for all featured patients',
  'GDPR — all patient and staff details anonymised or consented for public use',
  'Clinical accuracy — qualified clinician sign-off on all medical claims',
  'ASA guidelines — all claims about outcomes or waiting times provable and not misleading',
];

export default function AboutPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl">
        <h1 className="mb-4 font-display text-4xl font-semibold text-brand-deep sm:text-5xl">
          About this campaign
        </h1>
        <p className="text-lg text-muted sm:text-xl">
          The May–July 2026 social media campaign for CES Medical aims to increase patient trust,
          grow awareness of the services CES offers, and attract qualified leads — through
          consistent, high-quality content across Instagram, Facebook, LinkedIn, YouTube, and X.
        </p>
      </div>

      <section aria-labelledby="pillars-heading" className="mt-16">
        <h2
          id="pillars-heading"
          className="mb-8 font-display text-2xl font-semibold text-brand-deep sm:text-3xl"
        >
          The seven content pillars
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(pillarDescriptions) as Pillar[]).map((p) => (
            <div
              key={p}
              className="rounded-xl border border-brand-deep/10 bg-white p-5"
            >
              <h3 className="mb-2 font-display text-base font-semibold text-brand-deep">
                {PILLAR_LABELS[p]}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{pillarDescriptions[p]}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="approval-heading" className="mt-16">
        <h2
          id="approval-heading"
          className="mb-6 font-display text-2xl font-semibold text-brand-deep sm:text-3xl"
        >
          Two-stage approval
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl bg-brand-bg-soft p-6">
            <h3 className="mb-2 font-display text-base font-semibold text-brand-deep">
              Clinical review
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              Mandatory for all content related to treatments, conditions, outcomes, or patient
              testimonials. Ensures accuracy and compliance with clinical standards before
              anything reaches the brand reviewer.
            </p>
          </div>
          <div className="rounded-xl bg-brand-bg-soft p-6">
            <h3 className="mb-2 font-display text-base font-semibold text-brand-deep">
              Brand &amp; legal review
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              Mandatory for all content. Ensures brand consistency, legal compliance (GDPR, ASA),
              and adherence to patient consent protocols.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="compliance-heading" className="mt-16">
        <h2
          id="compliance-heading"
          className="mb-6 font-display text-2xl font-semibold text-brand-deep sm:text-3xl"
        >
          Compliance checklist
        </h2>
        <ul className="space-y-3 rounded-xl border border-brand-deep/10 bg-white p-6">
          {compliance.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Check size={12} />
              </span>
              <span className="text-sm leading-relaxed text-brand-deep">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
