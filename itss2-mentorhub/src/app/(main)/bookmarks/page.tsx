import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookmarkButton } from '@/components/layout/bookmark-button';
import { initials, formatDate } from '@/lib/utils';
import { Users, MessagesSquare, MessageSquare, BookMarked, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BookmarksPage() {
  const t = await getTranslations('bookmarks');
  const tCommon = await getTranslations('common');
  const tMentors = await getTranslations('mentors');
  const db = prisma;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;

  // Fetch all bookmarks
  const bookmarks = await db.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const mentorBookmarks = bookmarks.filter((b) => b.type === 'MENTOR');
  const threadBookmarks = bookmarks.filter((b) => b.type === 'THREAD');
  const answerBookmarks = bookmarks.filter((b) => b.type === 'ANSWER');

  // Fetch details
  const mentors = mentorBookmarks.length > 0
    ? await db.mentorProfile.findMany({
        where: { id: { in: mentorBookmarks.map((b) => b.targetId) } },
        include: { user: { select: { id: true, name: true, image: true } } },
      })
    : [];

  const threads = threadBookmarks.length > 0
    ? await db.thread.findMany({
        where: { id: { in: threadBookmarks.map((b) => b.targetId) } },
        include: {
          channel: true,
          author: { select: { id: true, name: true, image: true, role: true } },
          _count: { select: { answers: true } },
        },
      })
    : [];

  const answers = answerBookmarks.length > 0
    ? await db.answer.findMany({
        where: { id: { in: answerBookmarks.map((b) => b.targetId) } },
        include: {
          thread: { select: { id: true, title: true } },
          author: { select: { id: true, name: true, image: true, role: true } },
        },
      })
    : [];

  // Map mentor list back to key
  const mentorMap = new Map(mentors.map((m) => [m.id, m]));
  const threadMap = new Map(threads.map((t) => [t.id, t]));
  const answerMap = new Map(answers.map((a) => [a.id, a]));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookMarked className="h-8 w-8 text-primary" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      {bookmarks.length === 0 ? (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-primary/10 rounded-full text-primary scale-110">
              <BookMarked className="h-10 w-10" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-semibold text-lg">{t('empty')}</h3>
              <p className="text-sm text-muted-foreground">
                Hãy khám phá các cố vấn xuất sắc, thảo luận hữu ích và lưu trữ chúng để xem lại sau.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="/mentors" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                Xem cố vấn <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/channels" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                Xem thảo luận <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="mentors" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1 rounded-xl max-w-md">
            <TabsTrigger value="mentors" className="rounded-lg text-xs md:text-sm font-medium">
              {t('tabs.mentors', { count: mentorBookmarks.length })}
            </TabsTrigger>
            <TabsTrigger value="threads" className="rounded-lg text-xs md:text-sm font-medium">
              {t('tabs.threads', { count: threadBookmarks.length })}
            </TabsTrigger>
            <TabsTrigger value="answers" className="rounded-lg text-xs md:text-sm font-medium">
              {t('tabs.answers', { count: answerBookmarks.length })}
            </TabsTrigger>
          </TabsList>

          {/* MENTORS TAB */}
          <TabsContent value="mentors" className="space-y-4 pt-4">
            {mentorBookmarks.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title={t('empty')}
                description={tCommon('noData')}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mentorBookmarks.map((b) => {
                  const m = mentorMap.get(b.targetId);
                  if (!m) return null;
                  return (
                    <Link key={m.id} href={`/mentors/${m.userId}`}>
                      <Card className="premium-glow-card relative h-full transition-all border border-border/60 hover:border-primary/45 shadow-sm">
                        <CardHeader className="flex-row gap-3 space-y-0 pr-12">
                          <Avatar className="h-12 w-12 border border-border/40">
                            {m.user.image && <AvatarImage src={m.user.image} alt={m.user.name} />}
                            <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <CardTitle className="truncate text-base font-semibold">{m.user.name}</CardTitle>
                            <p className="truncate text-xs text-muted-foreground">
                              {m.position} · {m.company}
                            </p>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">{tMentors('experience', { years: m.yearsOfExperience })}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {m.expertise.slice(0, 3).map((s) => (
                              <Badge key={s} variant="tag" className="text-xs">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <div className="absolute top-3 right-3 z-10">
                          <BookmarkButton
                            type="MENTOR"
                            targetId={m.id}
                            initialBookmarked={true}
                          />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* THREADS TAB */}
          <TabsContent value="threads" className="space-y-4 pt-4">
            {threadBookmarks.length === 0 ? (
              <EmptyState
                icon={<MessagesSquare className="h-8 w-8" />}
                title={t('empty')}
                description={tCommon('noData')}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {threadBookmarks.map((b) => {
                  const th = threadMap.get(b.targetId);
                  if (!th) return null;
                  return (
                    <Link key={th.id} href={`/threads/${th.id}`}>
                      <Card className="premium-glow-card relative h-full transition-all border border-border/60 hover:border-primary/45 shadow-sm">
                        <CardHeader className="pr-12">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Badge variant="muted" className="text-[10px] py-0">
                              {th.channel.name}
                            </Badge>
                            <span>·</span>
                            <span>{formatDate(th.createdAt)}</span>
                          </div>
                          <CardTitle className="text-base font-semibold leading-snug line-clamp-2 pr-4">
                            {th.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              {!th.isAnonymous && th.author.image && <AvatarImage src={th.author.image} alt={th.author.name} />}
                              <AvatarFallback className="text-[10px]">{th.isAnonymous ? '?' : initials(th.author.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {th.isAnonymous ? 'Người dùng ẩn danh' : th.author.name}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {th._count.answers} câu trả lời
                            </span>
                          </div>
                        </CardContent>
                        <div className="absolute top-4 right-4 z-10">
                          <BookmarkButton
                            type="THREAD"
                            targetId={th.id}
                            initialBookmarked={true}
                          />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ANSWERS TAB */}
          <TabsContent value="answers" className="space-y-4 pt-4">
            {answerBookmarks.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-8 w-8" />}
                title={t('empty')}
                description={tCommon('noData')}
              />
            ) : (
              <div className="space-y-4">
                {answerBookmarks.map((b) => {
                  const a = answerMap.get(b.targetId);
                  if (!a) return null;
                  return (
                    <Card key={a.id} className="relative border border-border/60 overflow-hidden shadow-xs hover:border-primary/20 transition-all">
                      <CardHeader className="bg-muted/15 py-3 border-b border-border/40 pr-14 flex-row items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground font-medium truncate">
                          Trả lời trong bài viết:{' '}
                          <Link href={`/threads/${a.threadId}`} className="text-foreground hover:underline font-semibold">
                            {a.thread.title}
                          </Link>
                        </span>
                      </CardHeader>
                      <CardContent className="relative py-4 pr-14 space-y-3">
                        <div className="absolute top-4 right-4 z-10">
                          <BookmarkButton
                            type="ANSWER"
                            targetId={a.id}
                            initialBookmarked={true}
                          />
                        </div>
                        <div className="flex items-center gap-2.5 text-xs">
                          <Avatar className="h-6 w-6">
                            {!a.isAnonymous && a.author.image && <AvatarImage src={a.author.image} alt={a.author.name} />}
                            <AvatarFallback className="text-[10px]">{a.isAnonymous ? '?' : initials(a.author.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">
                            {a.isAnonymous ? 'Người dùng ẩn danh' : a.author.name}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{formatDate(a.createdAt)}</span>
                        </div>
                        <div
                          className="prose-claude text-sm line-clamp-3 text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: a.content }}
                        />
                      </CardContent>
                    </Card>

                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
