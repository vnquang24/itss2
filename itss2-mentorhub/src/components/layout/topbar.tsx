'use client';

import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { MobileSidebar } from './mobile-sidebar';
import { LanguageSwitcher } from './language-switcher';
import { useSidebar } from './sidebar-provider';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function Topbar({ right }: { right?: React.ReactNode }) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 md:hidden">
          <MobileSidebar />
          <Link href="/channels" className="text-sm font-semibold tracking-tight">
            Stubiz
          </Link>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {right}
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}

