'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getEnhancedDbForActor } from '@/lib/enhanced-db';
import { getOrCreateActor } from '@/lib/actor';
import { htmlPlainLength } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rate-limit';

const threadSchema = z.object({
  channelId: z.string().cuid(),
  channelSlug: z.string().min(1),
  title: z.string().min(5).max(300),
  content: z.string().min(1).max(80000),
  tags: z.string().optional(),
  isAnonymous: z.boolean().optional().default(false),
});

export async function createThreadAction(input: unknown) {
  // Allow guests: auto-create a cookie-backed anonymous User when needed.
  const actor = await getOrCreateActor();

  // Spam guard: stricter for guests (~3/hour) than logged-in users (~5/hour).
  const rl = rateLimit(`thread:${actor.id}`, {
    capacity: actor.isGuest ? 3 : 5,
    refillPerSec: (actor.isGuest ? 3 : 5) / 3600,
  });
  if (!rl.allowed) return { ok: false as const, error: 'RATE_LIMIT' };

  const parsed = threadSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'INVALID' };

  const cleanContent = sanitizeHtml(parsed.data.content);
  const plainLen = htmlPlainLength(cleanContent);
  if (plainLen < 1 || plainLen > 40000) return { ok: false as const, error: 'INVALID_LENGTH' };

  const tags = parsed.data.tags
    ? parsed.data.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const db = getEnhancedDbForActor(actor);
  // Guests are always treated as anonymous — their generated name is opaque anyway.
  const isAnonymous = actor.isGuest ? true : parsed.data.isAnonymous ?? false;
  const thread = await db.thread.create({
    data: {
      title: parsed.data.title,
      content: cleanContent,
      channelId: parsed.data.channelId,
      authorId: actor.id,
      isAnonymous,
      tags,
    },
  });

  revalidatePath(`/channels/${parsed.data.channelSlug}`);
  redirect(`/threads/${thread.id}`);
}
