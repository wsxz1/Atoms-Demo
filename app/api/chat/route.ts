import { NextRequest } from 'next/server';
import { streamText, generateText, type CoreMessage } from 'ai';
import { getModel, hasApiKey } from '@/lib/ai';
import { prisma } from '@/lib/db';
import {
  ENGINEER_SYSTEM,
  PM_SYSTEM,
  ARCHITECT_SYSTEM,
} from '@/lib/prompts';
import { extractHtml } from '@/lib/extract-html';
import { readUserId } from '@/lib/user';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChatBody {
  projectId: string;
  message: string;
  useAgents?: boolean;
}

type EventPayload =
  | { type: 'agent_start'; stage: 'pm' | 'architect' | 'engineer' }
  | { type: 'agent_delta'; stage: 'pm' | 'architect' | 'engineer'; delta: string }
  | { type: 'agent_done'; stage: 'pm' | 'architect' | 'engineer'; text: string }
  | { type: 'code_delta'; delta: string }
  | { type: 'code_done'; html: string }
  | { type: 'message_saved'; message: { id: string; createdAt: string } }
  | { type: 'error'; error: string };

function sse(data: EventPayload) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  if (!hasApiKey()) {
    return new Response(
      JSON.stringify({
        error:
          'DEEPSEEK_API_KEY 未配置。请在 .env 中填入有效的 DeepSeek API Key 后重启服务。',
      }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const userId = readUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: '会话未初始化' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = (await req.json()) as ChatBody;
  if (!body.projectId || !body.message?.trim()) {
    return new Response(JSON.stringify({ error: '参数缺失' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const project = await prisma.project.findUnique({
    where: { id: body.projectId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!project || project.userId !== userId) {
    return new Response(JSON.stringify({ error: '项目不存在或无权访问' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  const isFirstTurn = project.messages.length === 0;
  const useAgents = body.useAgents !== false && isFirstTurn;
  const userMessage = body.message.trim();

  // Persist user message immediately so chat history reflects it even if generation fails later.
  await prisma.message.create({
    data: {
      projectId: project.id,
      role: 'user',
      content: userMessage,
    },
  });

  // Build prior engineer-facing message history (skipping agent meta stages).
  const engineerHistory: CoreMessage[] = project.messages
    .filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.agentStage))
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: EventPayload) => controller.enqueue(encoder.encode(sse(e)));

      try {
        // --- Phase 1+2: PM + Architect (only on first turn) -----------------
        let pmText = '';
        let archText = '';
        if (useAgents) {
          send({ type: 'agent_start', stage: 'pm' });
          const pmResult = await generateText({
            model: getModel(),
            system: PM_SYSTEM,
            prompt: `用户需求：${userMessage}`,
            maxTokens: 300,
            temperature: 0.4,
          });
          pmText = pmResult.text.trim();
          send({ type: 'agent_done', stage: 'pm', text: pmText });
          await prisma.message.create({
            data: {
              projectId: project.id,
              role: 'assistant',
              content: pmText,
              agentStage: 'pm',
            },
          });

          send({ type: 'agent_start', stage: 'architect' });
          const archResult = await generateText({
            model: getModel(),
            system: ARCHITECT_SYSTEM,
            prompt: `用户需求：${userMessage}\n\nPM 简报：\n${pmText}`,
            maxTokens: 300,
            temperature: 0.4,
          });
          archText = archResult.text.trim();
          send({ type: 'agent_done', stage: 'architect', text: archText });
          await prisma.message.create({
            data: {
              projectId: project.id,
              role: 'assistant',
              content: archText,
              agentStage: 'architect',
            },
          });
        }

        // --- Phase 3: Engineer (always streams) -----------------------------
        send({ type: 'agent_start', stage: 'engineer' });

        const engineerMessages: CoreMessage[] = [...engineerHistory];

        // Include the current user message; on first turn enrich it with PM + Arch outputs.
        if (useAgents) {
          engineerMessages.push({
            role: 'user',
            content: `用户需求：${userMessage}\n\n# PM 简报\n${pmText}\n\n# 架构方案\n${archText}\n\n请基于以上信息，输出完整可运行的单文件 HTML 应用。`,
          });
        } else {
          // Provide current HTML as context for iterative edits.
          const context =
            project.currentHtml &&
            `\n\n# 当前应用代码（请基于此修改并完整重写）\n\`\`\`html\n${project.currentHtml}\n\`\`\``;
          engineerMessages.push({
            role: 'user',
            content: `${userMessage}${context || ''}`,
          });
        }

        const result = streamText({
          model: getModel(),
          system: ENGINEER_SYSTEM,
          messages: engineerMessages,
          temperature: 0.5,
          maxTokens: 8000,
        });

        let full = '';
        for await (const chunk of result.textStream) {
          full += chunk;
          send({ type: 'code_delta', delta: chunk });
        }

        const html = extractHtml(full);
        if (!html) {
          send({
            type: 'error',
            error:
              '模型未返回有效的 HTML 代码块。请重试或换一种描述方式。',
          });
          await prisma.message.create({
            data: {
              projectId: project.id,
              role: 'assistant',
              content: full,
              agentStage: 'engineer',
            },
          });
          controller.close();
          return;
        }

        const saved = await prisma.message.create({
          data: {
            projectId: project.id,
            role: 'assistant',
            content: full,
            agentStage: 'engineer',
          },
        });
        await prisma.project.update({
          where: { id: project.id },
          data: {
            currentHtml: html,
            ...(isFirstTurn ? { prompt: userMessage } : {}),
          },
        });

        send({ type: 'code_done', html });
        send({
          type: 'message_saved',
          message: { id: saved.id, createdAt: saved.createdAt.toISOString() },
        });
        controller.close();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : '未知错误，请稍后重试';
        send({ type: 'error', error: msg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
    },
  });
}
