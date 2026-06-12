import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActor } from '@/lib/actor';
import { canAccessChannelVisibility } from '@/lib/channel-access';
import { sanitizeAnonymousList } from '@/lib/anonymous';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { MessagesSquare, Search, Plus } from 'lucide-react';
import { formatDate, initials } from '@/lib/utils';
import { NewThreadDialog } from '@/components/threads/new-thread-dialog';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function ChannelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? '').trim().slice(0, 100);
  const t = await getTranslations('threads');
  const tChannels = await getTranslations('channels');
  const db = prisma;
  const actor = await getActor();

  const channel = await db.channel.findUnique({ where: { slug } });
  if (!channel) notFound();
  if (!channel.approved && actor?.role !== 'ADMIN' && actor?.id !== channel.createdById) notFound();
  if (channel.approved && !canAccessChannelVisibility(actor?.role, channel.visibility)) notFound();

  const where = {
    channelId: channel.id,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { content: { contains: q, mode: 'insensitive' as const } },
            { tags: { has: q } },
          ],
        }
      : {}),
  };

  const [rawThreads, totalThreads] = await Promise.all([
    db.thread.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        _count: { select: { answers: true } },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.thread.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalThreads / PAGE_SIZE));

  const threads = sanitizeAnonymousList(rawThreads, { id: undefined, role: undefined });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="muted">{channel.category}</Badge>
            {channel.visibility === 'MENTOR_EMPLOYER' ? (
              <Badge variant="outline">{tChannels('visibility.mentorEmployerShort')}</Badge>
            ) : null}
            <h1 className="font-serif text-2xl tracking-tight">{channel.name}</h1>
          </div>
          {channel.description && <p className="max-w-2xl text-muted-foreground">{channel.description}</p>}
          <div className="flex flex-wrap gap-1">
            {channel.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <NewThreadDialog
          channelId={channel.id}
          channelSlug={channel.slug}
          trigger={
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              {t('newThread')}
            </Button>
          }
        />
      </header>

      {/* Search form (server-side filter via ?q=) */}
      <form method="GET" className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder={t('searchPlaceholder')}
            maxLength={100}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>
        {q ? (
          <Link
            href={`/channels/${slug}`}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            {t('clearSearch')}
          </Link>
        ) : null}
      </form>
      {q ? (
        <p className="text-xs text-muted-foreground">
          {t('searchResultCount', { count: totalThreads, q })}
        </p>
      ) : null}

      <div className="space-y-5">
        {threads.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare className="h-6 w-6" />}
            title={q ? t('noSearchResult') : t('emptyTitle')}
            description={q ? t('noSearchResultHint') : t('emptyHint')}
          />
        ) : (
          threads.map((th) => {
            const displayName = th.isAnonymous ? null : th.author?.name;
            return (
              <Link key={th.id} href={`/threads/${th.id}`} className="block">
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex gap-4 py-4">
                    <Avatar className="h-9 w-9">
                      {!th.isAnonymous && th.author?.image && <AvatarImage src={th.author.image} alt={th.author.name} />}
                      <AvatarFallback>{th.isAnonymous ? '?' : initials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 font-medium">{th.title}</h3>
                        {th.pinned && <Badge variant="default">Pinned</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {displayName ?? <span className="italic">Người dùng ẩn danh</span>} · {formatDate(th.createdAt)} ·{' '}
                        {t('answersCount', { count: th._count.answers })}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {th.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-2 pt-2 text-sm">
          {page > 1 ? (
            <Link
              href={`/channels/${slug}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) }).toString()}`}
              className="rounded-md border border-border px-3 py-1 hover:bg-accent"
            >
              ← Trước
            </Link>
          ) : null}
          <span className="text-muted-foreground">{page} / {totalPages}</span>
          {page < totalPages ? (
            <Link
              href={`/channels/${slug}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) }).toString()}`}
              className="rounded-md border border-border px-3 py-1 hover:bg-accent"
            >
              Sau →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
