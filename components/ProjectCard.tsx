'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatTime, truncate } from '@/lib/utils';

interface Props {
  id: string;
  name: string;
  prompt: string;
  hasHtml: boolean;
  updatedAt: string;
}

export function ProjectCard({ id, name, prompt, hasHtml, updatedAt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const onDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) startTransition(() => router.refresh());
  };

  return (
    <Link
      href={`/projects/${id}`}
      className="group relative block rounded-xl border bg-card p-4 transition hover:border-foreground/30 hover:shadow-sm"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="line-clamp-1 text-sm font-semibold">{name}</div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            hasHtml
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {hasHtml ? '已生成' : '草稿'}
        </span>
      </div>
      <p className="mb-3 line-clamp-2 h-8 text-xs text-muted-foreground">
        {truncate(prompt || '尚未输入需求', 90)}
      </p>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatTime(updatedAt)}</span>
        <button
          onClick={onDelete}
          disabled={isPending}
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 opacity-0 transition group-hover:opacity-100 ${
            confirming
              ? 'bg-red-50 text-red-600 opacity-100 dark:bg-red-900/30'
              : 'hover:bg-muted'
          }`}
        >
          <Trash2 size={12} />
          {confirming ? '再点一次确认' : ''}
        </button>
      </div>
    </Link>
  );
}
