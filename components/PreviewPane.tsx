'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Code2,
  Eye,
  RotateCw,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface Props {
  html: string;
  projectName: string;
}

type Tab = 'preview' | 'code';
type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

export function PreviewPane({ html, projectName }: Props) {
  const [tab, setTab] = useState<Tab>('preview');
  const [device, setDevice] = useState<Device>('desktop');
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const empty = !html || html.trim().length === 0;

  useEffect(() => {
    if (tab === 'preview') {
      setIframeKey((k) => k + 1);
    }
  }, [html, tab]);

  const refresh = () => setIframeKey((k) => k + 1);

  const download = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'atoms-app'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
          <button
            onClick={() => setTab('preview')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
              tab === 'preview'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Eye size={12} />
            预览
          </button>
          <button
            onClick={() => setTab('code')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
              tab === 'code'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Code2 size={12} />
            代码
          </button>
        </div>

        {tab === 'preview' && !empty && (
          <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
            {(
              [
                { id: 'desktop', icon: Monitor },
                { id: 'tablet', icon: Tablet },
                { id: 'mobile', icon: Smartphone },
              ] as const
            ).map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setDevice(id)}
                className={cn(
                  'inline-flex h-6 w-7 items-center justify-center rounded-md text-muted-foreground transition',
                  device === id && 'bg-muted text-foreground',
                )}
              >
                <Icon size={12} />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          {!empty && tab === 'preview' && (
            <button
              onClick={refresh}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-card text-muted-foreground transition hover:text-foreground"
              title="刷新"
            >
              <RotateCw size={12} />
            </button>
          )}
          {!empty && tab === 'code' && (
            <button
              onClick={copy}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-card px-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? '已复制' : '复制'}
            </button>
          )}
          {!empty && (
            <button
              onClick={download}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-card px-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <Download size={12} />
              下载
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-stretch justify-center overflow-hidden bg-[#fafafa] p-4 dark:bg-[#0a0a0a]">
        {empty ? (
          <EmptyState />
        ) : tab === 'preview' ? (
          <div
            className="h-full overflow-hidden rounded-xl border bg-white shadow-sm transition-all"
            style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}
          >
            <iframe
              key={iframeKey}
              ref={iframeRef}
              srcDoc={html}
              title={projectName}
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="h-full w-full overflow-auto rounded-xl border bg-white text-xs dark:bg-[#1e1e1e]">
            <SyntaxHighlighter
              language="markup"
              style={oneLight}
              showLineNumbers
              customStyle={{
                margin: 0,
                padding: '16px',
                background: 'transparent',
                fontSize: '12px',
                lineHeight: '1.6',
              }}
              codeTagProps={{ style: { fontFamily: 'ui-monospace, monospace' } }}
            >
              {html}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border bg-card">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground [animation-delay:200ms]" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-muted-foreground [animation-delay:400ms]" />
          </div>
        </div>
        <div className="mb-1 text-sm font-medium">等待 Agent 团队产出</div>
        <div className="text-xs text-muted-foreground">
          在左侧描述你想要的应用，应用将在这里实时呈现
        </div>
      </div>
    </div>
  );
}
