import { Logo } from '@/components/brand/Logo';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-brand-deep/10 bg-brand-bg-soft">
      <div className="container-page py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Logo className="h-10 w-auto sm:h-11" />
            <p className="text-sm text-muted">
              Campaign roadmap · May–July 2026
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
