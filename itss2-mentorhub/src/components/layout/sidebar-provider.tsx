'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}>({ collapsed: false, setCollapsed: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setCollapsed(true);
    }
  }, []);

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val);
    localStorage.setItem('sidebar-collapsed', String(val));
  };

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed: handleSetCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

export function MainLayoutContent({
  children,
  actorBadge,
}: {
  children: React.ReactNode;
  actorBadge: React.ReactNode;
}) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen">
      <div
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-card/40 shrink-0 transition-all duration-300 ease-in-out',
          collapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-60 lg:w-64',
        )}
      >
        <Sidebar />
      </div>
      <div className="flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out">
        <Topbar right={actorBadge} />
        <main className="flex-1 px-4 py-6 md:px-8 lg:px-10 xl:px-12">
          <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

