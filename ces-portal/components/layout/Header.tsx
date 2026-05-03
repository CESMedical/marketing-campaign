import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Nav } from '@/components/layout/Nav';
import { AuthButton } from '@/components/layout/AuthButton';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-deep/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="CES Medical home">
          <Logo className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <Nav />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
