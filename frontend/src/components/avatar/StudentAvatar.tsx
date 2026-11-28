'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AvatarAppearance, AvatarEquippedItems, FlameTier } from '@/types/student';
import { StudentAvatar2D } from './StudentAvatar2D';
import { StudentAvatar3D } from './StudentAvatar3D';
import { AvatarAnimationState } from './three/avatarAnimations';

export type StudentAvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'lobby';

export interface StudentAvatarProps {
  appearance?: Partial<AvatarAppearance>;
  equippedItems?: Partial<AvatarEquippedItems>;
  size?: StudentAvatarSize;
  mode?: 'auto' | '3d' | '2d';
  variant?: 'card' | 'stage';
  animation?: AvatarAnimationState;
  interactive?: boolean;
  celebrateTrigger?: number;
  reducedMotion?: boolean;
  flameTier?: FlameTier;
  className?: string;
  onInteract?: () => void;
}

const SIZE_CLASSES: Record<StudentAvatarSize, string> = {
  sm: 'h-12 w-12',
  md: 'h-24 w-24',
  lg: 'h-40 w-40 sm:h-44 sm:w-44',
  xl: 'h-72 w-full sm:h-80',
  hero: 'h-64 w-52 sm:h-72 sm:w-60',
  lobby: 'h-[340px] w-full sm:h-[410px]',
};

class Avatar3DErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Graceful fallback to 2D avatar
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function StudentAvatar({
  appearance,
  equippedItems,
  size = 'lg',
  mode = 'auto',
  variant = 'card',
  animation = 'idle',
  interactive = true,
  celebrateTrigger = 0,
  reducedMotion = false,
  flameTier = 'none',
  className = '',
  onInteract,
}: StudentAvatarProps) {
  const use2D = mode === '2d' || (mode === 'auto' && size === 'sm');
  const fallbackSize = size === 'hero' || size === 'lobby' ? 'xl' : size;

  if (use2D) {
    return (
      <StudentAvatar2D
        appearance={appearance}
        equippedItems={equippedItems}
        size={fallbackSize}
        className={className}
      />
    );
  }

  const sizeClass = SIZE_CLASSES[size];

  return (
    <Avatar3DErrorBoundary
      fallback={
        <StudentAvatar2D
          appearance={appearance}
          equippedItems={equippedItems}
          size={fallbackSize}
          className={className}
        />
      }
    >
      <StudentAvatar3D
        appearance={appearance}
        equippedItems={equippedItems}
        animation={animation}
        interactive={interactive}
        celebrateTrigger={celebrateTrigger}
        reducedMotion={reducedMotion}
        variant={variant}
        flameTier={flameTier}
        fallbackSize={fallbackSize}
        onInteract={onInteract}
        className={`${sizeClass} ${className}`}
      />
    </Avatar3DErrorBoundary>
  );
}
