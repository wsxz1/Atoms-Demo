'use client';

import { useState } from 'react';
import { AGENTS, type AgentStage } from '@/lib/prompts';
import { Check, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AgentStatus {
  stage: AgentStage;
  state: 'idle' | 'running' | 'done' | 'error';
  text: string;
}

interface Props {
  agents: AgentStatus[];
}

export function AgentTimeline({ agents }: Props) {
  const anyActive = agents.some((a) => a.state === 'running');
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="shrink-0 border-b">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          {anyActive ? (
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-blue-500" />
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-blue-500 [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-blue-500 [animation-delay:400ms]" />
            </div>
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            Agent 团队 · {anyActive ? '工作中' : '就绪'}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            'text-muted-foreground transition',
            expanded ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          <ol className="space-y-1.5">
            {agents.map((a) => {
              const meta = AGENTS[a.stage];
              return (
                <li
                  key={a.stage}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border bg-card px-2.5 py-2 text-xs transition',
                    a.state === 'running' && 'border-blue-500/50 bg-blue-50/40 dark:bg-blue-900/10',
                    a.state === 'done' && 'border-border',
                    a.state === 'error' && 'border-red-500/50 bg-red-50/40',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold',
                      a.state === 'idle' && 'bg-muted text-muted-foreground',
                      a.state === 'running' && 'bg-blue-500 text-white',
                      a.state === 'done' && 'bg-emerald-500 text-white',
                      a.state === 'error' && 'bg-red-500 text-white',
                    )}
                  >
                    {a.state === 'running' && (
                      <Loader2 size={11} className="animate-spin" />
                    )}
                    {a.state === 'done' && <Check size={11} />}
                    {a.state === 'error' && <AlertCircle size={11} />}
                    {a.state === 'idle' && meta.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{meta.name}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="truncate text-muted-foreground">
                        {meta.role}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'truncate text-[10.5px]',
                        a.state === 'running'
                          ? 'shimmer-text font-medium'
                          : 'text-muted-foreground',
                      )}
                    >
                      {a.state === 'running'
                        ? '思考中…'
                        : a.state === 'done' && a.stage !== 'engineer'
                          ? '已完成'
                          : a.state === 'done'
                            ? '应用已生成'
                            : meta.description}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
