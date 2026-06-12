import { NextResponse } from 'next/server';
import { getActor } from '@/lib/actor';
import { buildApprovedChannelWhere } from '@/lib/channel-access';
import { getEnhancedDb } from '@/lib/enhanced-db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ channels: [], mentors: [], companies: [], jobs: [] });
  }

  const db = await getEnhancedDb();
  const actor = await getActor();
  const like = { contains: q, mode: 'insensitive' as const };

  const [channels, mentors, companies, jobs] = await Promise.all([
    db.channel.findMany({
      where: {
        ...buildApprovedChannelWhere(actor?.role),
        OR: [{ name: like }, { description: like }, { tags: { has: q } }],
      },
      select: { id: true, name: true, slug: true, category: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    db.mentorProfile.findMany({
      where: {
        verified: true,
        OR: [
          { position: like },
          { company: like },
          { expertise: { has: q } },
          { user: { is: { name: like } } },
        ],
      },
      select: {
        id: true,
        userId: true,
        position: true,
        company: true,
        user: { select: { name: true } },
      },
      take: 5,
      orderBy: { yearsOfExperience: 'desc' },
    }),
    db.company.findMany({
      where: { OR: [{ name: like }, { industry: like }, { location: like }] },
      select: { id: true, name: true, slug: true, industry: true },
      take: 5,
      orderBy: { name: 'asc' },
    }),
    db.job.findMany({
      where: {
        status: 'OPEN',
        OR: [{ title: like }, { location: like }, { tags: { has: q } }],
      },
      select: {
        id: true,
        title: true,
        location: true,
        company: { select: { name: true } },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({ channels, mentors, companies, jobs });
}
