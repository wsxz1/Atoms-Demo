import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { readUserId } from '@/lib/user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const userId = readUserId();
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const existing = await prisma.project.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    isPublic?: boolean;
  };

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.isPublic !== undefined ? { isPublic: body.isPublic } : {}),
    },
  });
  return NextResponse.json({ project: updated });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const userId = readUserId();
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const existing = await prisma.project.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
