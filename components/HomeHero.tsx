'use client';

import { useRouter } from 'next/navigation';
import { ArrowUp, Sparkles } from 'lucide-react';
import { useState, useTransition } from 'react';

export function HomeHero() {
  const [prompt, setPrompt] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = prompt.trim();
    if (!text || isPending) return;
    startTransition(() => {
      router.push(`/start?prompt=${encodeURIComponent(text)}`);
    });
  };

  return (
    <form
      onSubmit={submit}
      className="group relative rounded-2xl border bg-card shadow-sm transition focus-within:border-foreground/40 focus-within:shadow-md"
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
        }}
        placeholder="想做点什么？例如：帮我做一个支持暗黑模式的极简博客首页…"
        rows={3}
        className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 pr-14 text-base outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between border-t px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles size={12} />
          <span>多 Agent 协作 · 流式生成 · 实时预览</span>
        </div>
        <button
          type="submit"
          disabled={!prompt.trim() || isPending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-medium text-background transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-90"
        >
          {isPending ? '准备中…' : '开始生成'}
          <ArrowUp size={14} />
        </button>
      </div>
    </form>
  );
}
