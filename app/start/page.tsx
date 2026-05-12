import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ensureUserId } from '@/lib/user';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { prompt?: string; name?: string };
}

/**
 * Lightweight entry point that creates a new project from a prompt and
 * redirects to the editor. Used both by the homepage form and the template
 * shortcuts. Keeps the homepage as a pure server component without forms.
 */
export default async function StartPage({ searchParams }: Props) {
  const userId = ensureUserId();
  const prompt = (searchParams.prompt ?? '').trim();
  const name = (searchParams.name ?? '').trim() || '未命名项目';

  if (!prompt) {
    redirect('/');
  }

  const project = await prisma.project.create({
    data: {
      userId,
      name,
      prompt,
    },
  });

  redirect(`/projects/${project.id}?auto=1`);
}
