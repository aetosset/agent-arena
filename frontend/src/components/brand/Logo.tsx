'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/config/brand';
import { THEME } from '@/config/theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  linkTo?: string;
  className?: string;
}

const SIZES = {
  sm: { icon: 24, text: 'text-lg' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 48, text: 'text-2xl' },
};

export default function Logo({ 
  size = 'md', 
  showText = true, 
  linkTo = '/',
  className = '',
}: LogoProps) {
  const { icon: iconSize, text: textSize } = SIZES[size];
  
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <div 
        className="relative flex-shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <Image
          src={THEME.logo}
          alt={BRAND.name}
          width={iconSize}
          height={iconSize}
          className="object-contain"
          priority
        />
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`font-bold ${textSize} tracking-tight`}>
          {BRAND.name}
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
