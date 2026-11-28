'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Award,
  Bell,
  Compass,
  Globe2,
  Home,
  LogOut,
  Palette,
  Trophy,
  User,
} from 'lucide-react';
import { clearAuthSession, getCachedDashboard } from '@/lib/apiClient';
import { StudentAvatarState, StudentDashboardData } from '@/types/student';
import { StudentAvatar2D } from '@/components/avatar/StudentAvatar2D';

interface StudentNavShellProps {
  displayName?: string;
  level?: number;
  avatar?: StudentAvatarState | null;
  notifications?: Array<{ id: string; text: string; time?: string }>;
  noScroll?: boolean;
  accessibility?: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
  };
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/', label: 'Base Camp', shortLabel: 'Camp', icon: Home },
  { href: '/world', label: 'World Map', shortLabel: 'World', icon: Globe2 },
  { href: '/student/avatar', label: 'Avatar Studio', shortLabel: 'Avatar', icon: Palette },
  { href: '/student/achievements', label: 'Badges', shortLabel: 'Badges', icon: Award },
  { href: '/student/leaderboard', label: 'Rankings', shortLabel: 'Ranks', icon: Trophy },
  { href: '/student/profile', label: 'Profile', shortLabel: 'Profile', icon: User },
];

export function StudentNavShell({
  displayName = 'Explorer',
  level = 1,
  avatar,
  notifications = [],
  noScroll = false,
  accessibility,
  children,
}: StudentNavShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [cachedA11y, setCachedA11y] = useState<StudentNavShellProps['accessibility']>();

  useEffect(() => {
    if (accessibility) return;
    const cached = getCachedDashboard<StudentDashboardData>();
    if (cached?.profile?.accessibilitySettings) {
      setCachedA11y(cached.profile.accessibilitySettings);
    }
  }, [accessibility]);

  const effectiveA11y = accessibility ?? cachedA11y;

  const handleSignOut = () => {
    clearAuthSession();
    router.push('/');
  };

  return (
    <div
      data-vq-font={effectiveA11y?.fontSize ?? 'medium'}
      data-vq-contrast={effectiveA11y?.highContrast ? 'high' : 'normal'}
      data-vq-motion={effectiveA11y?.reducedMotion ? 'reduced' : 'normal'}
      className={`h-[100dvh] bg-[#071426] text-[#F3EFE6] ${
        noScroll
          ? 'overflow-y-auto pb-16 md:overflow-hidden md:pb-0'
          : 'vq-scroll overflow-y-auto pb-20 md:pb-8'
      }`}
    >
      {/* Top Game Command Bar */}
      <header className="sticky top-0 z-40 border-b border-[#233B59] bg-[#071426]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#F5B900]/70 bg-[#13253D] text-[#F5B900] shadow-[0_2px_0_#040B16] transition group-hover:bg-[#1A3150]">
                <Compass className="h-5 w-5" />
              </span>
              <span className="text-base font-black tracking-wide text-[#E9DFC7] sm:text-lg">
                VIDYA<span className="text-[#F5B900]">QUEST</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === '/'
                    ? pathname === '/' || pathname === '/student/dashboard'
                    : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold tracking-wide transition ${
                      active
                        ? 'border border-[#FFD95A] bg-[#F5B900] text-[#071426] shadow-[0_2px_0_#9A6D00]'
                        : 'border border-transparent text-[#E9DFC7]/80 hover:border-[#233B59] hover:bg-[#0D1B2D] hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#233B59] bg-[#0D1B2D] text-[#E9DFC7] transition hover:border-[#F5B900]/70 hover:text-[#F5B900]"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#F5B900]" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#F5B900]/50 bg-[#0D1B2D] p-3 shadow-2xl">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#F5B900]">
                    Adventure Log
                  </p>
                  {notifications.length === 0 ? (
                    <p className="mt-2 text-xs text-[#E9DFC7]/70">
                      No new alerts. Complete a quest to earn rewards!
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {notifications.slice(0, 4).map((n) => (
                        <li
                          key={n.id}
                          className="rounded-lg border border-[#233B59] bg-[#071426] p-2 text-xs text-[#E9DFC7]"
                        >
                          {n.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Player Pill */}
            <Link
              href="/student/profile"
              className="flex items-center gap-2 rounded-lg border border-[#233B59] bg-[#0D1B2D] px-2.5 py-1 transition hover:border-[#F5B900]/70"
            >
              <StudentAvatar2D
                appearance={avatar?.appearance}
                equippedItems={avatar?.equippedItems}
                size="sm"
                className="!h-7 !w-7 !rounded-md !border !border-[#F5B900]/40"
              />
              <div className="hidden text-left sm:block">
                <p className="text-xs font-extrabold leading-tight text-[#E9DFC7]">
                  {displayName}
                </p>
                <p className="text-[10px] font-black text-[#F5B900]">Lv.{level}</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#233B59] bg-[#0D1B2D] text-[#E9DFC7]/75 transition hover:border-rose-400/70 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 ${
          noScroll ? 'py-2 md:h-[calc(100dvh-3.5rem)] md:overflow-hidden' : 'py-5'
        }`}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 border-t border-[#233B59] bg-[#071426]/98 py-1.5 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/'
              ? pathname === '/' || pathname === '/student/dashboard'
              : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold ${
                active ? 'text-[#F5B900]' : 'text-[#E9DFC7]/65'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
