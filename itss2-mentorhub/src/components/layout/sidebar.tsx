'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessagesSquare, Users, MessageCircle, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

// Added Bookmarks to navigation items
const items = [
  { href: '/channels', key: 'channels', icon: MessagesSquare },
  { href: '/mentors', key: 'mentors', icon: Users },
  { href: '/chat', key: 'chat', icon: MessageCircle },
  { href: '/bookmarks', key: 'bookmarks', icon: Bookmark },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/channels"
        className="mb-1 block px-3 pb-4 pt-1"
        onClick={onNavigate}
      >
        <div className="font-serif text-2xl font-bold tracking-tight text-primary">
          Stubiz
        </div>
        <div className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
          Mentor &middot; Community
        </div>
      </Link>
      <div className="mx-3 mb-3 h-px bg-border" />
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors',
                active
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar() {
  return (
    <div className="flex h-full w-full flex-col px-3 py-4">
      <SidebarNav />
    </div>
  );
}
