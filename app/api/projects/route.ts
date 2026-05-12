import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUserId } from '@/lib/user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = ensureUserId();
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      prompt: true,
      currentHtml: true,
      updatedAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const userId = ensureUserId();
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    prompt?: string;
  };

  const project = await prisma.project.create({
    data: {
      userId,
      name: body.name?.trim() || '未命名项目',
      prompt: body.prompt?.trim() || '',
    },
  });
  return NextResponse.json({ project });
}
