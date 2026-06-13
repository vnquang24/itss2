'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { toggleBookmarkAction } from '@/app/(main)/bookmarks/actions';

interface BookmarkButtonProps {
  type: 'MENTOR' | 'THREAD' | 'ANSWER';
  targetId: string;
  initialBookmarked: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'secondary';
}

export function BookmarkButton({
  type,
  targetId,
  initialBookmarked,
  className,
  size = 'icon',
  variant = 'ghost',
}: BookmarkButtonProps) {
  const t = useTranslations('bookmarks');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  const handleToggle = () => {
    if (isPending) return;

    // Optimistic update
    const nextState = !bookmarked;
    setBookmarked(nextState);

    startTransition(async () => {
      const res = await toggleBookmarkAction(type, targetId);
      if (!res.ok) {
        // Revert on error
        setBookmarked(bookmarked);
        if (res.error === 'UNAUTHORIZED') {
          toast({
            title: tCommon('loading'),
            description: 'Vui lòng đăng nhập hoặc khởi tạo phiên để lưu.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Lỗi',
            description: 'Không thể thực hiện tác vụ. Vui lòng thử lại.',
            variant: 'destructive',
          });
        }
        return;
      }

      // Sync actual state returned by server
      if (res.bookmarked !== undefined) {
        setBookmarked(res.bookmarked);
        toast({
          title: res.bookmarked ? t('saved') : t('unsave'),
          description: res.bookmarked ? t('toastSaved') : t('toastUnsaved'),
        });
      }

    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      disabled={isPending}
      className={cn(
        'relative group rounded-full transition-all duration-300 hover:scale-105 active:scale-95',
        bookmarked
          ? 'text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        className,
      )}
      title={bookmarked ? t('unsave') : t('save')}
    >
      <Bookmark
        className={cn(
          'h-5 w-5 transition-transform duration-300 group-hover:scale-110',
          bookmarked ? 'fill-current stroke-current' : 'fill-none',
        )}
      />
    </Button>
  );
}
