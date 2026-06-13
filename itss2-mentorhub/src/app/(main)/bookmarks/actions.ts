'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function toggleBookmarkAction(type: 'MENTOR' | 'THREAD' | 'ANSWER', targetId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'UNAUTHORIZED' };
  }
  const userId = session.user.id;

  try {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_type_targetId: {
          userId,
          type,
          targetId,
        },
      },
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      revalidatePath('/bookmarks');
      revalidatePath('/mentors');
      revalidatePath(`/mentors/${targetId}`);
      revalidatePath(`/threads/${targetId}`);
      return { ok: true, bookmarked: false };
    } else {
      await prisma.bookmark.create({
        data: {
          userId,
          type,
          targetId,
        },
      });
      revalidatePath('/bookmarks');
      revalidatePath('/mentors');
      revalidatePath(`/mentors/${targetId}`);
      revalidatePath(`/threads/${targetId}`);
      return { ok: true, bookmarked: true };
    }
  } catch (err) {
    console.error('Bookmark toggle error:', err);
    return { ok: false, error: 'SERVER_ERROR' };
  }
}
