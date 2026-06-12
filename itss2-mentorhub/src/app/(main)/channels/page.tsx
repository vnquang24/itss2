import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getActor } from '@/lib/actor';
import { buildApprovedChannelWhere, canAccessChannelVisibility } from '@/lib/channel-access';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { FilterChips } from '@/components/layout/filter-chips';
import { CreateChannelDialog } from '@/components/channels/create-channel-dialog';
import { Search, MessagesSquare, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;
const CATEGORIES = [
  'FRONTEND',
  'BACKEND',
  'DEVOPS',
  'MOBILE',
  'DATA_AI',
  'PROCESS_GIT',
  'PROCESS_SCRUM',
  'CAREER',
] as const;

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function ChannelsPage({ searchParams }: PageProps) {
  const t = await getTranslations('channels');
  const tCommon = await getTranslations('common');
  const sp = await searchParams;
  const db = prisma;

  const actor = await getActor();
  const createChannelRole = actor && !actor.isGuest ? actor.role : null;
  let personalizedChannels: any[] = [];
  let studentSkills: string[] = [];

  if (actor && actor.role === 'STUDENT') {
    const profile = await db.studentProfile.findUnique({
      where: { userId: actor.id },
      select: { skills: true },
    });
    if (profile && profile.skills && profile.skills.length > 0) {
      studentSkills = profile.skills;
      personalizedChannels = await db.channel.findMany({
        where: {
          ...buildApprovedChannelWhere(actor.role),
          tags: { hasSome: profile.skills },
        },
        include: { _count: { select: { threads: true } } },
        orderBy: [{ createdAt: 'desc' }],
        take: 3,
      });
    }
  }

  const accessWhere = buildApprovedChannelWhere(actor?.role);
  const where = {
    ...accessWhere,
    ...(sp.q
      ? {
          OR: [
            { name: { contains: sp.q, mode: 'insensitive' as const } },
            { description: { contains: sp.q, mode: 'insensitive' as const } },
            { tags: { has: sp.q } },
          ],
        }
      : {}),
    ...(sp.category && sp.category !== 'ALL' ? { category: sp.category as any } : {}),
  };

  const total = await db.channel.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(sp.page) || 1));

  const channels = await db.channel.findMany({
    where,
    include: { _count: { select: { threads: true } } },
    orderBy: [{ createdAt: 'desc' }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const categoryChips = [
    { value: 'ALL', label: t('categoryAll') },
    ...CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`) })),
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card/60 px-6 py-7 shadow-sm md:px-8 md:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl tracking-tight md:text-4xl">{t('title')}</h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">{t('subtitle')}</p>
          </div>
          {createChannelRole ? <CreateChannelDialog role={createChannelRole} /> : null}
        </div>

        <form action="/channels" className="relative mt-6 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={sp.q ?? ''} placeholder={t('searchPlaceholder')} className="pl-9" />
          {sp.category ? <input type="hidden" name="category" value={sp.category} /> : null}
        </form>

        <div className="mt-4">
          <FilterChips
            chips={categoryChips}
            activeValue={sp.category}
            paramName="category"
            basePath="/channels"
            extraParams={{ q: sp.q }}
          />
        </div>
      </section>

      {personalizedChannels.length > 0 && (
        <section className="space-y-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-primary/10 rounded-lg text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                Kênh thảo luận dành riêng cho bạn
              </h2>
              <p className="text-xs text-muted-foreground">
                Gợi ý dựa trên các chủ đề bạn quan tâm: {studentSkills.map((s) => `#${s}`).join(', ')}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {personalizedChannels.map((c) => (
              <Link key={c.id} href={`/channels/${c.slug}`} className="group">
                <Card className="h-full border-primary/15 transition-all duration-200 hover:border-primary/50 bg-card/40 backdrop-blur-sm shadow-sm hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors truncate max-w-[150px]">{c.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        {canAccessChannelVisibility(actor?.role, c.visibility) && c.visibility === 'MENTOR_EMPLOYER' ? (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {t('visibility.mentorEmployerShort')}
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary bg-primary/5">
                          {t(`categories.${c.category}`)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="tag" className="text-[10px] py-0 px-1.5">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="flex items-center gap-1 border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                      <MessagesSquare className="h-3 w-3" />
                      <span>
                        <span className="font-semibold text-foreground">{c._count.threads}</span> {t('threads')}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {t('countLabel', { count: total })}
          </h2>
        </div>

        {channels.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare className="h-6 w-6" />}
            title={t('empty')}
            description={tCommon('noData')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((c) => (
              <Link key={c.id} href={`/channels/${c.slug}`} className="group">
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base group-hover:text-primary">{c.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        {c.visibility === 'MENTOR_EMPLOYER' ? (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {t('visibility.mentorEmployerShort')}
                          </Badge>
                        ) : null}
                        <Badge variant="muted">{t(`categories.${c.category}`)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="tag" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      <MessagesSquare className="h-3.5 w-3.5" />
                      <span>
                        <span className="font-medium text-foreground">{c._count.threads}</span> {t('threads')}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          buildHref={(p) => {
            const params = new URLSearchParams();
            if (sp.q) params.set('q', sp.q);
            if (sp.category) params.set('category', sp.category);
            if (p > 1) params.set('page', String(p));
            const qs = params.toString();
            return qs ? `/channels?${qs}` : '/channels';
          }}
          prevLabel={tCommon('back')}
          nextLabel={tCommon('next')}
        />
      </section>
    </div>
  );
}
