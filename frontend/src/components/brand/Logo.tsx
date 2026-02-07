'use client';

import { BRAND } from '@/config/brand';
import { THEME } from '@/config/theme';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: 'text-base' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 48, text: 'text-3xl' },
};

export function Logo({ size = 'md', showText = true, href = '/', className = '' }: LogoProps) {
  const { icon: iconSize, text: textSize } = sizes[size];
  
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div 
        className="bg-[var(--color-primary)] flex items-center justify-center"
        style={{ 
          width: iconSize, 
          height: iconSize,
          transform: `rotate(${THEME.logo.rotation}deg)`,
        }}
      >
        {(THEME.logo.type as string) === 'icon' && (
          <span 
            className="text-black font-bold"
            style={{ 
              fontSize: iconSize * 0.4,
              transform: `rotate(-${THEME.logo.rotation}deg)`,
            }}
          >
            {THEME.logo.icon}
          </span>
        )}
        {(THEME.logo.type as string) === 'image' && (
          <img 
            src={THEME.logo.imageSrc} 
            alt={BRAND.name}
            style={{ 
              width: iconSize * 0.7,
              height: iconSize * 0.7,
              transform: `rotate(-${THEME.logo.rotation}deg)`,
            }}
          />
        )}
      </div>
      
      {/* Brand Name */}
      {showText && (
        <span className={`font-bold tracking-tight ${textSize}`}>
          {BRAND.name}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * Compact logo for mobile headers
 */
export function LogoCompact({ href = '/' }: { href?: string }) {
  return <Logo size="sm" showText={true} href={href} />;
}

/**
 * Full logo with tagline for landing pages
 */
export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Logo size="lg" showText={true} href="/" />
      <p className="text-[var(--color-text-secondary)] text-sm mt-2">
        {BRAND.tagline}
      </p>
    </div>
  );
}
