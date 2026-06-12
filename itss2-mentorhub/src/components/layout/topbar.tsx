'use client';

import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { MobileSidebar } from './mobile-sidebar';
import { LanguageSwitcher } from './language-switcher';

// Bản demo: bỏ tìm kiếm header, thông báo và menu đăng nhập/đăng ký.
export function Topbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <MobileSidebar />
        <Link href="/channels" className="text-sm font-semibold tracking-tight">
          Stubiz
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {right}
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
