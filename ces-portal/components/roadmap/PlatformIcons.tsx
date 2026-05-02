import { Platform, PLATFORM_LABELS } from '@/types/post';
import { Instagram, Facebook, Linkedin, Youtube, Twitter } from 'lucide-react';

const iconMap = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  x: Twitter,
};

export function PlatformIcons({
  platforms,
  size = 14,
  className,
}: {
  platforms: Platform[];
  size?: number;
  className?: string;
}) {
  return (
    <ul className={`flex items-center gap-1.5 ${className ?? ''}`} aria-label="Platforms">
      {platforms.map((p) => {
        const Icon = iconMap[p];
        return (
          <li key={p} title={PLATFORM_LABELS[p]} className="text-muted">
            <Icon size={size} aria-label={PLATFORM_LABELS[p]} />
          </li>
        );
      })}
    </ul>
  );
}
