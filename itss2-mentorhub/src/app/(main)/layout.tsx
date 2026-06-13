import { SidebarProvider, MainLayoutContent } from '@/components/layout/sidebar-provider';
import { ActorBadge } from '@/components/layout/actor-badge';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <MainLayoutContent actorBadge={<ActorBadge />}>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}


