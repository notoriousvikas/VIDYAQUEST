'use client';

import React from 'react';
import Link from 'next/link';

export type GameButtonVariant = 'gold' | 'navy' | 'emerald' | 'ghost' | 'danger';
export type GameButtonSize = 'sm' | 'md' | 'lg';

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant;
  size?: GameButtonSize;
  href?: string;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<GameButtonVariant, string> = {
  gold: 'bg-[#F5B900] text-[#071426] border-[#FFD95A] shadow-[0_4px_0_#9A6D00] hover:bg-[#FFC61A] active:translate-y-[2px] active:shadow-[0_2px_0_#9A6D00]',
  navy: 'bg-[#132640] text-[#E9DFC7] border-[#2C4669] shadow-[0_4px_0_#071426] hover:bg-[#193254] hover:border-[#F5B900]/60 active:translate-y-[2px] active:shadow-[0_2px_0_#071426]',
  emerald:
    'bg-[#228B5B] text-white border-[#4ADE80]/50 shadow-[0_4px_0_#135235] hover:bg-[#28A069] active:translate-y-[2px] active:shadow-[0_2px_0_#135235]',
  ghost:
    'bg-[#0D1B2D]/80 text-[#E9DFC7]/90 border-[#243B59] hover:border-[#F5B900]/50 hover:text-white active:translate-y-[1px]',
  danger:
    'bg-[#7F1D1D]/90 text-rose-100 border-rose-400/40 shadow-[0_3px_0_#450A0A] hover:bg-[#991B1B] active:translate-y-[2px] active:shadow-[0_1px_0_#450A0A]',
};

const SIZE_CLASSES: Record<GameButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-xs sm:text-sm gap-2 rounded-xl',
  lg: 'px-7 py-3.5 text-sm sm:text-base gap-2.5 rounded-xl',
};

export function GameButton({
  variant = 'navy',
  size = 'md',
  href,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: GameButtonProps) {
  const classes = `inline-flex items-center justify-center border font-extrabold uppercase tracking-wider transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B900] disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
}
