'use client';

import { Pencil, Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  projectId: string;
  initialName: string;
  editable: boolean;
}

export function ProjectNameEditor({ projectId, initialName, editable }: Props) {
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const begin = () => {
    if (!editable) return;
    setDraft(name);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      cancel();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setName(trimmed);
      setEditing(false);
      document.title = `${trimmed} · Atoms Demo`;
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            else if (e.key === 'Escape') cancel();
          }}
          disabled={saving}
          maxLength={60}
          className="h-7 w-48 rounded-md border bg-card px-2 text-sm outline-none transition focus:border-foreground/40"
        />
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="保存"
        >
          <Check size={13} />
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="取消"
        >
          <X size={13} />
        </button>
        {error && (
          <span className="text-xs text-red-500" title={error}>
            ⚠
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={begin}
      disabled={!editable}
      className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium transition enabled:hover:bg-muted disabled:cursor-default"
      title={editable ? '点击重命名' : ''}
    >
      <span>{name}</span>
      {editable && (
        <Pencil
          size={11}
          className="text-muted-foreground opacity-0 transition group-hover:opacity-100"
        />
      )}
    </button>
  );
}
