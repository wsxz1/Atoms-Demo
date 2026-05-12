'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, AlertTriangle } from 'lucide-react';
import { AGENTS } from '@/lib/prompts';
import type { UIMessage } from './Editor';
import { cn } from '@/lib/utils';

interface Props {
  messages: UIMessage[];
  onSend: (text: string) => void;
  busy: boolean;
  error: string | null;
  disabled?: boolean;
}

/**
 * Strip the html code block out of an engineer message so the chat bubble
 * displays a friendly summary instead of a 200-line code dump.
 */
function summarizeEngineerOutput(raw: string): string {
  const withoutCode = raw.replace(/```[\s\S]*?```/g, '').trim();
  if (withoutCode.length > 0) return withoutCode;
  return '已生成完整 HTML 应用，可在右侧实时预览与体验。';
}

function renderInlineMarkdown(text: string): string {
  // Tiny markdown: **bold**, *italic*, `code`, line breaks
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

function renderMessage(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${renderInlineMarkdown(bullet[1])}</li>`);
      continue;
    }
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    if (line.trim() === '') {
      out.push('<br/>');
    } else {
      out.push(`<p>${renderInlineMarkdown(line)}</p>`);
    }
  }
  if (inList) out.push('</ul>');
  return out.join('');
}

export function ChatPanel({
  messages,
  onSend,
  busy,
  error,
  disabled,
}: Props) {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = input.trim();
    if (!t || busy || disabled) return;
    onSend(t);
    setInput('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 && !busy && (
          <div className="rounded-xl border bg-muted/20 px-3.5 py-3 text-xs text-muted-foreground">
            描述你想要的应用，三位 Agent 会先产出产品 / 架构方案，再交给工程师生成可运行的 HTML。
          </div>
        )}

        {messages.map((m) => {
          if (m.role === 'user') {
            return (
              <div
                key={m.id}
                className="ml-auto max-w-[88%] animate-fade-in rounded-2xl rounded-tr-sm bg-foreground px-3.5 py-2.5 text-sm text-background"
              >
                {m.content}
              </div>
            );
          }

          const stage = m.agentStage;
          const meta = stage ? AGENTS[stage] : null;
          const isEngineer = stage === 'engineer';
          const displayText = isEngineer
            ? summarizeEngineerOutput(m.content)
            : m.content;

          return (
            <div
              key={m.id}
              className={cn(
                'max-w-[92%] animate-fade-in rounded-2xl rounded-tl-sm border bg-card px-3.5 py-2.5 text-sm',
                isEngineer && 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-900/10',
              )}
            >
              {meta && (
                <div className="mb-1 flex items-center gap-1.5 text-[11px]">
                  <span
                    className={cn(
                      'inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white',
                      stage === 'pm' && 'bg-purple-500',
                      stage === 'architect' && 'bg-orange-500',
                      stage === 'engineer' && 'bg-emerald-500',
                    )}
                  >
                    {meta.emoji}
                  </span>
                  <span className="font-medium">{meta.name}</span>
                  <span className="text-muted-foreground">· {meta.role}</span>
                </div>
              )}
              <div
                className="prose-msg"
                dangerouslySetInnerHTML={{ __html: renderMessage(displayText) }}
              />
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground" />
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground [animation-delay:400ms]" />
            </span>
            <span>Agent 团队正在工作…</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-50/60 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="shrink-0 border-t bg-background p-3"
      >
        <div className="relative rounded-xl border bg-card transition focus-within:border-foreground/40">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              disabled
                ? '只读模式，无法发送消息'
                : messages.length === 0
                  ? '描述你想要的应用…'
                  : '继续迭代，例如：把按钮改成蓝色'
            }
            rows={2}
            disabled={busy || disabled}
            className="w-full resize-none bg-transparent px-3 py-2.5 pr-12 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy || disabled}
            className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background transition disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:opacity-90"
          >
            <ArrowUp size={14} />
          </button>
        </div>
        <div className="mt-1.5 px-1 text-[10.5px] text-muted-foreground">
          Enter 发送 · Shift+Enter 换行
        </div>
      </form>
    </div>
  );
}
