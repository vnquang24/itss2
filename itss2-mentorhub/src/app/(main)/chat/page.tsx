import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getActor } from '@/lib/actor';
import { getEnhancedDbForActor } from '@/lib/enhanced-db';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { initials, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const t = await getTranslations('chat');
  const actor = await getActor();
  // No session and no guest cookie yet — show empty CTA instead of a 404.
  if (!actor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">{t('guestIntro')}</p>
            <Link href="/mentors">
              <Button>{t('findMentor')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  const db = getEnhancedDbForActor(actor);

  const rooms = await db.chatRoom.findMany({
    include: {
      userA: { select: { id: true, name: true, image: true } },
      userB: { select: { id: true, name: true, image: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: {
        select: {
          messages: {
            where: { senderId: { not: actor.id }, readAt: null },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
          {actor.isGuest ? (
            <Badge variant="outline" className="mt-2">
              {t('guestBadge', { name: actor.name })}
            </Badge>
          ) : null}
        </div>
        <Link href="/mentors">
          <Button variant="outline" size="sm">
            {t('findMentor')}
          </Button>
        </Link>
      </div>
      {rooms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">{t('empty')}</p>
            <Link href="/mentors">
              <Button>{t('findMentor')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rooms.map((r) => {
            const other = r.userA.id === actor.id ? r.userB : r.userA;
            const last = r.messages[0];
            const unread = r._count.messages;
            return (
              <Link key={r.id} href={`/chat/${r.id}`} className="block">
                <Card className="premium-glow-card transition-all border border-border/60 hover:border-primary/45 shadow-2xs">
                  <CardContent className="flex items-center gap-3 py-3">
                    <Avatar className="h-10 w-10 border border-border/30">
                      {other.image && <AvatarImage src={other.image} alt={other.name} />}
                      <AvatarFallback>{initials(other.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{other.name}</p>
                        {unread > 0 && (
                          <Badge
                            variant="default"
                            className="h-5 min-w-[1.25rem] justify-center px-1.5 text-[10px]"
                          >
                            {unread}
                          </Badge>
                        )}
                      </div>
                      {last ? (
                        <p
                          className={`truncate text-xs ${
                            unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {last.senderId === actor.id ? `${t('youPrefix')} ` : ''}
                          {last.content} · {formatDate(last.createdAt)}
                        </p>
                      ) : (
                        <p className="truncate text-xs text-muted-foreground">{t('noMessages')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

      )}
    </div>
  );
}
