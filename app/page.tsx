import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ensureUserId } from '@/lib/user';
import { HomeHero } from '@/components/HomeHero';
import { ProjectCard } from '@/components/ProjectCard';
import { ApiKeyBanner } from '@/components/ApiKeyBanner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowUpRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const TEMPLATES = [
  {
    title: '待办应用',
    description: '本地存储 + 拖拽排序 + 暗黑模式',
    prompt:
      '帮我做一个极简风格的待办事项应用，支持添加、勾选完成、删除、按 Enter 提交、本地持久化（localStorage）。需要一个干净的卡片式 UI，主色用蓝色。',
    emoji: '✓',
  },
  {
    title: '番茄钟',
    description: '25/5 分钟循环，环形进度',
    prompt:
      '做一个番茄工作法计时器：25 分钟工作、5 分钟休息，环形 SVG 进度条，开始/暂停/重置按钮，每完成一轮播放短音效（用 Web Audio API 生成）。界面要现代化。',
    emoji: '◐',
  },
  {
    title: '记账小工具',
    description: '收支记录 + 月度统计',
    prompt:
      '做一个轻量记账应用：录入收入/支出（类别、金额、备注、日期），列表显示，本月总收入/支出/结余，记录持久化到 localStorage。中性灰阶 + 绿色为强调色。',
    emoji: '￥',
  },
  {
    title: '贪吃蛇游戏',
    description: 'Canvas 实现，方向键控制',
    prompt:
      '用 Canvas 做一个贪吃蛇小游戏：方向键控制，吃到食物加分，撞墙或撞自己结束，显示当前分数和历史最高分（localStorage），界面要精致现代。',
    emoji: '◆',
  },
];

export default async function HomePage() {
  const userId = ensureUserId();
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 12,
    select: {
      id: true,
      name: true,
      prompt: true,
      currentHtml: true,
      updatedAt: true,
    },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 pb-24 pt-16 md:pt-24">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <span className="text-sm font-bold">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Atoms Demo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="https://atoms.dev"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            官方平台 <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <ApiKeyBanner />

      <section className="mb-16">
        <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">
          用一句话，<br className="md:hidden" />
          生成可运行的 Web 应用
        </h1>
        <p className="mb-8 max-w-2xl text-base text-muted-foreground md:text-lg">
          描述你想要的应用，三位 AI Agent 协作产出产品需求、技术方案与可运行的 HTML 代码。
          所有应用持久保存，可一键分享与迭代修改。
        </p>
        <HomeHero />
      </section>

      <section className="mb-16">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          从模板开始
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <Link
              key={t.title}
              href={`/start?prompt=${encodeURIComponent(t.prompt)}&name=${encodeURIComponent(t.title)}`}
              className="group block rounded-xl border bg-card p-4 text-left transition hover:border-foreground/30 hover:shadow-sm"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg font-medium">
                {t.emoji}
              </div>
              <div className="mb-1 text-sm font-semibold">{t.title}</div>
              <div className="text-xs text-muted-foreground">
                {t.description}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            我的项目
          </h2>
          <span className="text-xs text-muted-foreground">
            {projects.length} 个项目
          </span>
        </div>
        {projects.length === 0 ? (
          <div className="rounded-xl border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
            还没有项目，输入想法或挑一个模板，让 Agent 团队为你构建。
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                id={p.id}
                name={p.name}
                prompt={p.prompt}
                hasHtml={Boolean(p.currentHtml)}
                updatedAt={p.updatedAt.toISOString()}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
