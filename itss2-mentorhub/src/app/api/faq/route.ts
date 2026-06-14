import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActor } from '@/lib/actor';
import { buildApprovedChannelWhere } from '@/lib/channel-access';

export const dynamic = 'force-dynamic';

const MAX_CANDIDATES = 80;
const MAX_RESULTS = 8;
const STOP_WORDS = new Set([
  'la',
  'và',
  'và',
  'the',
  'how',
  'what',
  'for',
  'với',
  'làm',
  'sao',
  'thế',
  'nào',
  'gì',
  'khi',
  'cho',
  'của',
  'một',
  'các',
  'được',
  'như',
  'để',
]);

/** Strip HTML tags + collapse whitespace into a plain-text snippet. */
function toSnippet(html: string, len = 180): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > len ? `${text.slice(0, len)}…` : text;
}

function tokenize(q: string): string[] {
  return Array.from(
    new Set(
      q
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s#+.-]/gu, ' ')
        .split(/\s+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter((t) => t.length >= 2 && !STOP_WORDS.has(t)),
    ),
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 200);
  const actor = await getActor();

  // Threads only live in channels the current actor is allowed to read.
  const channelWhere = buildApprovedChannelWhere(actor?.role);
  const baseInclude = {
    channel: { select: { name: true, slug: true, category: true } },
    answers: {
      select: { id: true, content: true, accepted: true, isAnonymous: true },
    },
    _count: { select: { answers: true } },
  } as const;

  // No query → return the most useful "frequently asked" questions:
  // those with an accepted solution, ranked by how many answers they drew.
  if (q.length < 2) {
    const popular = await prisma.thread.findMany({
      where: { channel: channelWhere, answers: { some: { accepted: true } } },
      include: baseInclude,
      orderBy: [{ answers: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: MAX_RESULTS,
    });
    return NextResponse.json({ popular: true, results: popular.map(toResult) });
  }

  const terms = tokenize(q);
  if (terms.length === 0) {
    return NextResponse.json({ popular: false, results: [] });
  }

  // Pull a generous candidate set matching ANY term, then rank in-memory so we
  // can weight title/tag/accepted-answer matches without DB full-text support.
  const candidates = await prisma.thread.findMany({
    where: {
      channel: channelWhere,
      OR: terms.flatMap((term) => [
        { title: { contains: term, mode: 'insensitive' as const } },
        { content: { contains: term, mode: 'insensitive' as const } },
        { tags: { has: term } },
      ]),
    },
    include: baseInclude,
    take: MAX_CANDIDATES,
  });

  const ql = q.toLowerCase();
  const scored = candidates
    .map((th) => {
      const title = th.title.toLowerCase();
      const content = th.content.toLowerCase();
      const tags = th.tags.map((t) => t.toLowerCase());
      const hasAccepted = th.answers.some((a) => a.accepted);

      let score = 0;
      // Whole-phrase match in the title is the strongest "same question" signal.
      if (title.includes(ql)) score += 12;
      for (const term of terms) {
        if (title.includes(term)) score += 5;
        if (tags.includes(term)) score += 4;
        if (content.includes(term)) score += 2;
      }
      // Answered + accepted questions are what an FAQ is really about.
      if (hasAccepted) score += 6;
      score += Math.min(th._count.answers, 5);

      return { th, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.th._count.answers - a.th._count.answers)
    .slice(0, MAX_RESULTS);

  return NextResponse.json({
    popular: false,
    results: scored.map(({ th }) => toResult(th)),
  });
}

type ThreadRow = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  channel: { name: string; slug: string; category: string } | null;
  answers: { content: string; accepted: boolean }[];
  _count: { answers: number };
};

function toResult(th: ThreadRow) {
  const accepted = th.answers.find((a) => a.accepted);
  return {
    id: th.id,
    title: th.title,
    tags: th.tags.slice(0, 4),
    channel: th.channel,
    answerCount: th._count.answers,
    hasAccepted: !!accepted,
    snippet: toSnippet(accepted ? accepted.content : th.content),
  };
}
