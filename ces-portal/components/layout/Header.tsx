import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Nav } from '@/components/layout/Nav';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-deep/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="CES Medical home">
          <Logo className="h-7 w-auto" />
        </Link>
        <Nav />
      </div>
    </header>
  );
}
