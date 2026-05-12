'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

interface Status {
  apiKeyConfigured: boolean;
  model: string;
}

export function ApiKeyBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => null);
  }, []);

  if (!status || status.apiKeyConfigured || dismissed) {
    return null;
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-50/60 px-4 py-3 text-sm dark:bg-amber-900/20">
      <AlertTriangle
        size={16}
        className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400"
      />
      <div className="flex-1">
        <div className="font-medium text-amber-900 dark:text-amber-200">
          尚未配置 DeepSeek API Key
        </div>
        <div className="mt-1 text-xs leading-relaxed text-amber-800/80 dark:text-amber-300/80">
          打开项目根目录的 <code className="rounded bg-amber-200/40 px-1 py-0.5">.env</code> 文件，把
          <code className="ml-1 rounded bg-amber-200/40 px-1 py-0.5">
            DEEPSEEK_API_KEY
          </code>
          替换为你的真实 key，然后重启 dev 服务即可开始生成。
        </div>
        <a
          href="https://platform.deepseek.com/api_keys"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-900 underline decoration-amber-500/40 underline-offset-2 hover:decoration-amber-700 dark:text-amber-200"
        >
          前往申请 API Key
          <ExternalLink size={11} />
        </a>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-700/70 transition hover:text-amber-900 dark:text-amber-400/70 dark:hover:text-amber-200"
        aria-label="关闭提示"
      >
        <X size={14} />
      </button>
    </div>
  );
}
