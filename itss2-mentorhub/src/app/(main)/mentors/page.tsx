import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { FilterChips } from '@/components/layout/filter-chips';
import { BookmarkButton } from '@/components/layout/bookmark-button';
import { Search, Users } from 'lucide-react';
import { initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{ q?: string; skill?: string; page?: string }>;
}

export default async function MentorsPage({ searchParams }: PageProps) {
  const t = await getTranslations('mentors');
  const tCommon = await getTranslations('common');
  const sp = await searchParams;
  const db = prisma;

  // Session & Bookmarks fetch
  const session = await auth();
  const userId = session?.user?.id;
  const bookmarks = userId
    ? await db.bookmark.findMany({
        where: { userId, type: 'MENTOR' },
        select: { targetId: true },
      })
    : [];
  const bookmarkedIds = new Set(bookmarks.map((b) => b.targetId));

  const baseWhere = { verified: true } as const;

  const where = {
    ...baseWhere,
    ...(sp.q
      ? {
          OR: [
            { position: { contains: sp.q, mode: 'insensitive' as const } },
            { company: { contains: sp.q, mode: 'insensitive' as const } },
            { expertise: { has: sp.q } },
            { user: { is: { name: { contains: sp.q, mode: 'insensitive' as const } } } },
          ],
        }
      : {}),
    ...(sp.skill && sp.skill !== 'ALL' ? { expertise: { has: sp.skill } } : {}),
  };

  const sample = await db.mentorProfile.findMany({
    where: baseWhere,
    select: { expertise: true },
    take: 200,
  });
  const skillCount = new Map<string, number>();
  for (const m of sample) for (const s of m.expertise) skillCount.set(s, (skillCount.get(s) ?? 0) + 1);
  const topSkills = [...skillCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s]) => s);

  const total = await db.mentorProfile.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(sp.page) || 1));

  const mentors = await db.mentorProfile.findMany({
    where,
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { yearsOfExperience: 'desc' },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const skillChips = [
    { value: 'ALL', label: tCommon('all') },
    ...topSkills.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      <form action="/mentors" className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={sp.q ?? ''}
          placeholder={t('searchPlaceholder')}
          className="pl-9"
        />
        {sp.skill ? <input type="hidden" name="skill" value={sp.skill} /> : null}
      </form>

      {topSkills.length > 0 ? (
        <FilterChips
          chips={skillChips}
          activeValue={sp.skill}
          paramName="skill"
          basePath="/mentors"
          extraParams={{ q: sp.q }}
        />
      ) : null}

      {mentors.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={t('empty')}
          description={tCommon('noData')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <Link key={m.id} href={`/mentors/${m.userId}`}>
              <Card className="premium-glow-card relative h-full transition-all border border-border/60 hover:border-primary/45 shadow-sm">
                <CardHeader className="flex-row gap-3 space-y-0 pr-10">
                  <Avatar className="h-12 w-12 border border-border/40">
                    {m.user.image && <AvatarImage src={m.user.image} alt={m.user.name} />}
                    <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base font-semibold group-hover:text-primary">{m.user.name}</CardTitle>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.position} · {m.company}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t('experience', { years: m.yearsOfExperience })}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.expertise.slice(0, 4).map((s) => (
                      <Badge key={s} variant="tag" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="success" className="text-[10px] py-0 px-2 font-medium">
                      {t('verified')}
                    </Badge>
                  </div>
                </CardContent>
                {/* Optimistic bookmark button */}
                <div className="absolute top-3 right-3 z-10">
                  <BookmarkButton
                    type="MENTOR"
                    targetId={m.id}
                    initialBookmarked={bookmarkedIds.has(m.id)}
                    size="icon"
                    variant="ghost"
                  />
                </div>
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
          if (sp.skill) params.set('skill', sp.skill);
          if (p > 1) params.set('page', String(p));
          const qs = params.toString();
          return qs ? `/mentors?${qs}` : '/mentors';
        }}
        prevLabel={tCommon('back')}
        nextLabel={tCommon('next')}
      />
    </div>
  );
}
