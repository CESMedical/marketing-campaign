import { Logo } from '@/components/brand/Logo';
import { loadCampaign } from '@/lib/posts';

function campaignRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function Footer() {
  const campaign = loadCampaign()
  const range = campaignRange(campaign.startDate, campaign.endDate)

  return (
    <footer className="mt-24 border-t border-brand-deep/10 bg-brand-bg-soft">
      <div className="container-page py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Logo className="h-8 w-auto sm:h-9" />
            <p className="text-sm text-muted">
              Campaign roadmap · {range}
            </p>
          </div>
          <p className="text-sm text-muted">
            For internal use only · Not patient-facing
          </p>
        </div>
      </div>
    </footer>
  );
}
