import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { StartChatButton } from '@/components/chat/start-chat-button';
import { BookmarkButton } from '@/components/layout/bookmark-button';
import { initials } from '@/lib/utils';
import { Trophy, Github, Linkedin, Calendar, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('mentors');
  const db = prisma;

  const mentor = await db.mentorProfile.findFirst({
    where: { userId: id, verified: true },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  if (!mentor) notFound();

  // Fetch bookmark state
  const session = await auth();
  const userId = session?.user?.id;
  const isBookmarked = userId
    ? (await db.bookmark.count({
        where: { userId, type: 'MENTOR', targetId: mentor.id },
      })) > 0
    : false;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="overflow-hidden border border-border/80 shadow-md">
        {/* Visual premium gradient header block */}
        <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/20" />
        
        <CardHeader className="relative flex-col md:flex-row items-start md:items-center gap-4 space-y-0 pt-0 pb-6 px-6">
          {/* Shift avatar upwards to overlap header gradient */}
          <Avatar className="h-20 w-20 border-4 border-card -mt-10 shadow-lg">
            {mentor.user.image && <AvatarImage src={mentor.user.image} alt={mentor.user.name} />}
            <AvatarFallback className="text-xl font-bold">{initials(mentor.user.name)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1 pt-2 md:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-serif text-2xl font-bold">{mentor.user.name}</CardTitle>
              <Badge variant="success" className="text-xs px-2.5 py-0.5 font-medium">
                {t('verified')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {mentor.position} · {mentor.company}
            </p>
            
            {/* Social links row */}
            <div className="flex gap-3 pt-2">
              {mentor.github && (
                <a
                  href={mentor.github.startsWith('http') ? mentor.github : `https://github.com/${mentor.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-accent/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                  title="GitHub"
                >
                  <Github className="h-4.5 w-4.5" />
                </a>
              )}
              {mentor.linkedin && (
                <a
                  href={mentor.linkedin.startsWith('http') ? mentor.linkedin : `https://linkedin.com/in/${mentor.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-accent/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                  title="LinkedIn"
                >
                  <Linkedin className="h-4.5 w-4.5" />
                </a>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-4 md:pt-0">
            <BookmarkButton
              type="MENTOR"
              targetId={mentor.id}
              initialBookmarked={isBookmarked}
              variant="outline"
              size="icon"
              className="border-border/80 h-10 w-10"
            />
            {mentor.openToChat ? (
              <StartChatButton targetUserId={mentor.userId} label={t('chatNow')} />
            ) : (
              <Badge variant="outline" className="px-3 py-1.5 text-sm">{t('notOpen')}</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 pb-8">
          <Separator />
          
          {/* Experience highlight block */}
          <div className="flex flex-wrap gap-4 text-sm bg-accent/40 p-4 rounded-xl border border-border/40">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{t('experience', { years: mentor.yearsOfExperience })}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Chuyên môn: {mentor.expertise.slice(0, 3).join(', ')}</span>
            </div>
          </div>

          {mentor.bio && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('bio')}</h3>
              <p className="whitespace-pre-line text-sm text-foreground/90 leading-relaxed bg-muted/10 p-4 rounded-xl border border-border/30">
                {mentor.bio}
              </p>
            </div>
          )}

          {mentor.achievements && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-500" />
                {t('achievements')}
              </h3>
              <p className="whitespace-pre-line text-sm text-foreground/90 leading-relaxed bg-gradient-to-br from-amber-500/5 via-transparent to-primary/5 p-4 rounded-xl border border-amber-500/10">
                {mentor.achievements}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('expertise')}</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.expertise.map((s) => (
                <Badge key={s} variant="outline" className="px-3 py-1 text-sm bg-card hover:bg-accent/50 transition-colors">
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          {(mentor.github || mentor.linkedin) && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('links')}</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {mentor.github && (
                  <a
                    href={mentor.github.startsWith('http') ? mentor.github : `https://github.com/${mentor.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
                  >
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{t('github')}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {mentor.github.replace(/^https?:\/\//, '')}
                    </span>
                  </a>
                )}
                {mentor.linkedin && (
                  <a
                    href={mentor.linkedin.startsWith('http') ? mentor.linkedin : `https://linkedin.com/in/${mentor.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
                  >
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{t('linkedin')}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {mentor.linkedin.replace(/^https?:\/\//, '')}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
