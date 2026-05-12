import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function SharePage({ params }: Props) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      prompt: true,
      currentHtml: true,
      isPublic: true,
      updatedAt: true,
    },
  });

  if (!project || !project.isPublic || !project.currentHtml) {
    notFound();
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      <header className="flex h-11 shrink-0 items-center justify-between border-b bg-card px-4 text-xs">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={13} />
          <span className="font-medium">Atoms Demo</span>
        </Link>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="hidden sm:inline">{project.name}</span>
          <span className="hidden sm:inline-block h-3 w-px bg-border" />
          <Sparkles size={12} />
          <span>AI 生成 · 实时运行</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={`/projects/${project.id}`}
            className="rounded-md border bg-card px-2 py-1 text-muted-foreground transition hover:text-foreground"
          >
            打开编辑器
          </Link>
        </div>
      </header>
      <iframe
        srcDoc={project.currentHtml}
        title={project.name}
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
        className="h-full w-full flex-1 bg-white"
      />
    </div>
  );
}
