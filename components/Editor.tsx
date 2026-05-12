'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatPanel } from './ChatPanel';
import { PreviewPane } from './PreviewPane';
import { AgentTimeline, type AgentStatus } from './AgentTimeline';
import { extractStreamingHtml } from '@/lib/extract-html';

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentStage: 'pm' | 'architect' | 'engineer' | null;
  createdAt: string;
}

interface Props {
  project: {
    id: string;
    name: string;
    prompt: string;
    currentHtml: string;
  };
  messages: UIMessage[];
  autoStart: boolean;
  isOwner: boolean;
}

interface SSEEvent {
  type: string;
  [k: string]: unknown;
}

async function* parseSSE(res: Response): AsyncGenerator<SSEEvent> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const line = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      try {
        yield JSON.parse(line.slice(6)) as SSEEvent;
      } catch {
        // ignore malformed
      }
    }
  }
}

const STAGES: Array<'pm' | 'architect' | 'engineer'> = [
  'pm',
  'architect',
  'engineer',
];

function buildInitialAgents(messages: UIMessage[]): AgentStatus[] {
  const map = new Map<string, AgentStatus>(
    STAGES.map((s) => [s, { stage: s, state: 'idle', text: '' }]),
  );
  for (const m of messages) {
    if (m.role === 'assistant' && m.agentStage) {
      map.set(m.agentStage, {
        stage: m.agentStage,
        state: 'done',
        text: m.content,
      });
    }
  }
  return STAGES.map((s) => map.get(s)!);
}

export function Editor({ project, messages, autoStart, isOwner }: Props) {
  const [chat, setChat] = useState<UIMessage[]>(messages);
  const [html, setHtml] = useState(project.currentHtml);
  const [streamingHtml, setStreamingHtml] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>(() =>
    buildInitialAgents(messages),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const send = async (text: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);

    const isFirst = chat.length === 0;
    const userMsg: UIMessage = {
      id: `tmp_${Date.now()}`,
      role: 'user',
      content: text,
      agentStage: null,
      createdAt: new Date().toISOString(),
    };
    setChat((c) => [...c, userMsg]);

    if (isFirst) {
      setAgents(STAGES.map((s) => ({ stage: s, state: 'idle', text: '' })));
    }

    let streamingBuf = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          message: text,
          useAgents: isFirst,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      for await (const evt of parseSSE(res)) {
        switch (evt.type) {
          case 'agent_start': {
            const stage = evt.stage as 'pm' | 'architect' | 'engineer';
            setAgents((curr) =>
              curr.map((a) =>
                a.stage === stage ? { ...a, state: 'running' } : a,
              ),
            );
            break;
          }
          case 'agent_done': {
            const stage = evt.stage as 'pm' | 'architect' | 'engineer';
            const txt = evt.text as string;
            setAgents((curr) =>
              curr.map((a) =>
                a.stage === stage ? { ...a, state: 'done', text: txt } : a,
              ),
            );
            if (stage !== 'engineer') {
              setChat((c) => [
                ...c,
                {
                  id: `agent_${stage}_${Date.now()}`,
                  role: 'assistant',
                  content: txt,
                  agentStage: stage,
                  createdAt: new Date().toISOString(),
                },
              ]);
            }
            break;
          }
          case 'code_delta': {
            streamingBuf += evt.delta as string;
            const partial = extractStreamingHtml(streamingBuf);
            if (partial && partial.length > 50) {
              setStreamingHtml(partial);
            }
            break;
          }
          case 'code_done': {
            const finalHtml = evt.html as string;
            setHtml(finalHtml);
            setStreamingHtml(null);
            setAgents((curr) =>
              curr.map((a) =>
                a.stage === 'engineer' ? { ...a, state: 'done' } : a,
              ),
            );
            setChat((c) => [
              ...c,
              {
                id: `eng_${Date.now()}`,
                role: 'assistant',
                content: streamingBuf,
                agentStage: 'engineer',
                createdAt: new Date().toISOString(),
              },
            ]);
            break;
          }
          case 'error': {
            setError((evt.error as string) || '生成失败');
            setAgents((curr) =>
              curr.map((a) =>
                a.state === 'running' ? { ...a, state: 'error' } : a,
              ),
            );
            break;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setBusy(false);
      setStreamingHtml(null);
    }
  };

  // Auto-start on first visit when redirected from /start
  useEffect(() => {
    if (!autoStart || autoTriggered.current) return;
    if (chat.length > 0) return;
    if (!project.prompt) return;
    autoTriggered.current = true;
    send(project.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, project.prompt]);

  return (
    <div className="grid h-full w-full grid-cols-1 md:grid-cols-[420px_1fr]">
      <aside className="flex h-full min-h-0 flex-col border-r">
        <AgentTimeline agents={agents} />
        <ChatPanel
          messages={chat}
          onSend={send}
          busy={busy}
          error={error}
          disabled={!isOwner}
        />
      </aside>
      <section className="h-full min-h-0">
        <PreviewPane html={streamingHtml ?? html} projectName={project.name} />
      </section>
    </div>
  );
}
