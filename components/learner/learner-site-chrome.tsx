'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Compass, GraduationCap, Home, RadioTower } from 'lucide-react';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/site-header/theme-toggle';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: Home },
  { href: '/courses', label: '發現課程', icon: Compass },
  { href: '/teach', label: '教師投稿', icon: GraduationCap },
  { href: '/standards', label: '課程依據', icon: BookOpen },
] as const;

export function LearnerSiteHeader() {
  const pathname = usePathname();

  return (
    <header className="mb-5 rounded-[1.35rem] border border-[#071a35]/10 bg-white/82 px-3 py-3 shadow-[0_10px_35px_rgba(24,71,122,0.08)] backdrop-blur-xl sm:px-5 dark:border-white/10 dark:bg-[#0d1d31]/82">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6]"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#071a35] text-[#71dce5] shadow-[0_8px_24px_rgba(7,26,53,.18)] dark:bg-[#71dce5] dark:text-[#071a35]">
            <RadioTower className="size-4" strokeWidth={2.2} />
          </span>
          <span className="text-xl font-black tracking-[-0.055em]">wanli.ai</span>
          <span className="hidden h-4 w-px bg-[#071a35]/15 sm:block dark:bg-white/15" />
          <span className="hidden font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#315374] lg:inline dark:text-[#8eabc8]">
            HK learning signal
          </span>
        </Link>

        <nav aria-label="主要導航" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.slice(1).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6]',
                  active
                    ? 'bg-[#071a35] text-white dark:bg-[#f4f8ff] dark:text-[#071a35]'
                    : 'text-[#315374] hover:bg-[#dce8f5] dark:text-[#a9bfd6] dark:hover:bg-white/10',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <nav
        aria-label="流動版主要導航"
        className="mt-3 flex gap-1 overflow-x-auto border-t border-[#174b80]/10 pt-3 md:hidden dark:border-white/10"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1847d6]',
                active
                  ? 'bg-[#071a35] text-white dark:bg-[#f4f8ff] dark:text-[#071a35]'
                  : 'text-[#45617e] dark:text-[#a9bfd6]',
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function LearnerSiteFooter() {
  return (
    <footer className="mt-20 grid gap-6 border-t border-[#174b80]/12 py-8 text-xs text-[#6b839b] sm:grid-cols-[1fr_auto] sm:items-end dark:border-white/10 dark:text-[#7891aa]">
      <div>
        <div className="font-mono font-bold uppercase tracking-[0.14em]">
          wanli.ai · HK learning signal
        </div>
        <p className="mt-2 max-w-xl leading-5">
          從香港的真實世界出發，重新理解資料，創作適合學生的 AI 互動課堂。
        </p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 sm:justify-end">
        <Link
          className="font-bold underline decoration-[#35d7e1]/65 underline-offset-4"
          href="/sources"
        >
          資料來源
        </Link>
        <Link
          className="font-bold underline decoration-[#35d7e1]/65 underline-offset-4"
          href="/teach"
        >
          教師投稿
        </Link>
        <Link
          className="font-bold underline decoration-[#35d7e1]/65 underline-offset-4"
          href="/open-source-licenses"
        >
          開源軟件聲明
        </Link>
        <span>© 2026 万里 AI 課堂</span>
      </div>
    </footer>
  );
}

export function LearnerPageShell({ children }: { readonly children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef4fb] text-[#071a35] dark:bg-[#07111f] dark:text-[#f4f8ff]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(14,71,129,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(14,71,129,0.055)_1px,transparent_1px)] [background-size:42px_42px] dark:opacity-20"
      />
      <div className="relative mx-auto max-w-[1480px] px-4 pb-24 pt-4 sm:px-8 sm:pt-6 lg:px-12">
        <LearnerSiteHeader />
        {children}
        <LearnerSiteFooter />
      </div>
    </main>
  );
}
