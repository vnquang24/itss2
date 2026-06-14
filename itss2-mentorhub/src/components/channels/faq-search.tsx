'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Search, HelpCircle, CheckCircle2, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type FaqResult = {
  id: string;
  title: string;
  tags: string[];
  channel: { name: string; slug: string; category: string } | null;
  answerCount: number;
  hasAccepted: boolean;
  snippet: string;
};

type FaqResponse = { popular: boolean; results: FaqResult[] };

export function FaqSearch() {
  const t = useTranslations('faq');
  const [q, setQ] = useState('');
  const [data, setData] = useState<FaqResponse>({ popular: false, results: [] });
  const [pending, start] = useTransition();

  const hasQuery = q.trim().length >= 2;

  useEffect(() => {
    const term = q.trim();
    // Chỉ tìm khi người dùng đã gõ ≥ 2 ký tự — không hiển thị danh sách mặc định.
    if (term.length < 2) {
      setData({ popular: false, results: [] });
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      start(async () => {
        try {
          const res = await fetch(`/api/faq?q=${encodeURIComponent(term)}`, {
            signal: ctrl.signal,
          });
          if (res.ok) setData(await res.json());
        } catch {
          /* aborted */
        }
      });
    }, 200);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q]);

  return (
    <section className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
          <HelpCircle className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {pending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          maxLength={200}
          className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {hasQuery && (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('resultLabel', { count: data.results.length })}
        </p>

        {data.results.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t('empty')}
          </p>
        ) : (
          <ul className="space-y-2">
            {data.results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/threads/${r.id}`}
                  className="group flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                      {r.title}
                    </h3>
                    {r.hasAccepted && (
                      <Badge variant="default" className="shrink-0 gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('solved')}
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{r.snippet}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-muted-foreground">
                    {r.channel && (
                      <span className="font-medium text-foreground/70">{r.channel.name}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {t('answersCount', { count: r.answerCount })}
                    </span>
                    {r.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="tag" className="px-1.5 py-0 text-[10px]">
                        #{tag}
                      </Badge>
                    ))}
                    <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}
    </section>
  );
}
