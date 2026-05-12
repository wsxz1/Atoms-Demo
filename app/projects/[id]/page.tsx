import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ensureUserId } from '@/lib/user';
import { Editor } from '@/components/Editor';
import { ProjectNameEditor } from '@/components/ProjectNameEditor';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
  searchParams: { auto?: string };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const userId = ensureUserId();
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!project) {
    notFound();
  }

  const isOwner = project.userId === userId;
  if (!isOwner && !project.isPublic) {
    notFound();
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ChevronLeft size={16} />
            <span>返回</span>
          </Link>
          <span className="h-4 w-px bg-border" />
          <ProjectNameEditor
            projectId={project.id}
            initialName={project.name}
            editable={isOwner}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ThemeToggle />
          <Link
            href={`/p/${project.id}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 transition hover:bg-muted"
          >
            打开分享页 ↗
          </Link>
        </div>
      </header>

      <Editor
        project={{
          id: project.id,
          name: project.name,
          prompt: project.prompt,
          currentHtml: project.currentHtml,
        }}
        messages={project.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          agentStage: m.agentStage as 'pm' | 'architect' | 'engineer' | null,
          createdAt: m.createdAt.toISOString(),
        }))}
        autoStart={searchParams.auto === '1'}
        isOwner={isOwner}
      />
    </div>
  );
}
