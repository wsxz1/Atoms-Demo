# Atoms Demo · 用一句话生成可运行的 Web 应用

一个 Atoms 风格的 AI 应用生成器：通过 **多 Agent 协作**（PM → 架构师 → 工程师）把自然语言转化为完整、可立即运行的 HTML 应用，左侧聊天驱动、右侧 iframe 实时预览。

> 6–8 小时挑战实现版本，作为 Atoms 工作流的最小可用复刻 (MVP)。

---

## 在线访问

| 项目 | 链接 |
| -- | -- |
| 在线 Demo | _部署后填入_ |
| 源代码 | _仓库地址_ |

---

## 核心特性

- **多 Agent 协作可视化** — 首次需求由 PM Emma → 架构师 Bob → 工程师 Alex 依次接力，每一步在左侧 Timeline 实时展示状态与产物。
- **流式生成 + 实时预览** — DeepSeek API 流式输出，HTML 代码块边写边解析，iframe 通过 `srcdoc` 安全沙箱呈现。
- **持续迭代修改** — 在同一项目内继续对话，AI 会基于当前代码完整重写并返回新版本。
- **设备预览切换** — Desktop / Tablet / Mobile 三种宽度即时切换查看响应式效果。
- **代码视图 + 下载 + 复制** — 顶部 Tab 切换源码视图，支持一键下载 `.html` 或复制到剪贴板。
- **一键分享** — `/p/[id]` 公开链接，纯净全屏运行，可直接发给评审人或朋友体验。
- **匿名用户** — 通过 HTTP-Only Cookie 自动绑定项目，零注册门槛，刷新仍能看到自己的项目列表。
- **数据持久化** — Prisma + SQLite（本地）或 Postgres（线上），项目与全部对话记录均落库。

---

## 技术栈

- **Next.js 14（App Router）+ TypeScript** — 单仓库托管前端、Server Component、API Route 与流式 SSE。
- **Tailwind CSS** — 现代、克制的视觉风格，参考 Linear / Vercel。
- **Vercel AI SDK** (`ai` + `@ai-sdk/openai`) — 统一调用 OpenAI 兼容接口；DeepSeek 通过自定义 `baseURL` 接入。
- **Prisma ORM + SQLite / Postgres** — 同一份 schema，本地零依赖、线上一键升级。
- **iframe `srcdoc` + `sandbox`** — 天然沙箱隔离生成的代码，避免污染主域。
- **react-syntax-highlighter** — 代码 Tab 的轻量高亮渲染。

---

## 运行方式

### 1. 准备环境

需要 Node.js 18+ 和一个 DeepSeek API Key（[申请入口](https://platform.deepseek.com/api_keys)）。

```bash
cp .env.example .env
```

编辑 `.env`：

```dotenv
DEEPSEEK_API_KEY=sk-你的真实key
DEEPSEEK_MODEL=deepseek-chat       # 或 deepseek-reasoner
DATABASE_URL="file:./dev.db"
```

### 2. 安装依赖 & 初始化数据库

```bash
npm install
npx prisma db push
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

### 4. 生产构建

```bash
npm run build
npm start
```

---

## 部署到 Vercel（推荐）

1. 把仓库推到 GitHub。
2. 在 Vercel 控制台 **Import Project**，框架自动识别为 Next.js。
3. 创建一个 Vercel Postgres 数据库，将其 `DATABASE_URL` 写入项目环境变量。
4. 在 [`prisma/schema.prisma`](prisma/schema.prisma) 把 `provider = "sqlite"` 改为 `provider = "postgresql"`，提交。
5. 添加环境变量：
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_MODEL`（可选，默认 `deepseek-chat`）
   - `DATABASE_URL`
6. 首次部署成功后，在 Vercel CLI 或本机连接生产 DB 跑一次：

   ```bash
   npx prisma db push
   ```

---

## 项目结构

```
Atoms-Demo/
├── app/
│   ├── layout.tsx                # 全局布局 + Inter 字体
│   ├── page.tsx                  # 首页：Hero + 模板 + 项目列表
│   ├── start/page.tsx            # 从 prompt 快速创建项目并跳转
│   ├── projects/[id]/page.tsx    # 编辑器（左聊天右预览）
│   ├── p/[id]/page.tsx           # 公开分享页（全屏 iframe）
│   └── api/
│       ├── chat/route.ts         # 多 Agent 编排 + 流式 SSE
│       └── projects/             # Project CRUD
├── components/
│   ├── HomeHero.tsx              # 首页输入框
│   ├── ProjectCard.tsx           # 项目卡片（含删除）
│   ├── Editor.tsx                # 编辑器整合：状态机 + SSE 消费
│   ├── AgentTimeline.tsx         # 三 Agent 状态卡片
│   ├── ChatPanel.tsx             # 对话区 + 输入框
│   └── PreviewPane.tsx           # Preview/Code Tab + 设备切换
├── lib/
│   ├── ai.ts                     # DeepSeek SDK 实例
│   ├── prompts.ts                # 三个 Agent 的 system prompt
│   ├── extract-html.ts           # 从模型输出中抽取 HTML
│   ├── db.ts                     # Prisma client 单例
│   ├── user.ts                   # cookie 读取
│   └── utils.ts                  # cn / truncate / formatTime
├── prisma/schema.prisma          # Project + Message 数据模型
└── middleware.ts                 # 匿名用户 cookie 注入
```

---

## 实现思路与关键取舍

### 1. 为什么把生成产物收敛为「单文件 HTML」？

Atoms 真正的产物是「多文件全栈项目 + 一键部署」，单纯复刻这一形态在 6-8h 内不可能稳定跑通（WebContainer / StackBlitz SDK 都有显著的接入与延迟成本）。

收敛到**单 HTML + Tailwind CDN + 内联 JS** 之后：
- 沙箱预览成本归零（`iframe srcdoc`）
- AI 生成失败率显著下降（一次完整文件 vs 多文件树）
- 真实可玩性反而更高 —— 待办、番茄钟、贪吃蛇这类应用完全够用
- 用户**仍能下载 `.html` 直接部署到任何静态站**，是真实可用，不是 PoC

代价：复杂的全栈应用（带后端、需 DB）暂不支持。后续可以替换为 WebContainer + Atoms Cloud 模拟层升级。

### 2. 多 Agent 编排：真协作 vs 视觉协作

第一次对话才触发完整 PM → Architect → Engineer 三阶段流程。后续迭代修改只调用 Engineer Alex，避免每次都跑三遍模型（成本与延迟双优化）。

PM / Architect 的输出**真实参与到** Engineer 的 prompt 上下文（不是纯 UI 表演），所以最终 HTML 质量明显优于直接喂原始 prompt。

### 3. 匿名用户 vs 完整账号系统

考虑到 6-8h 时间盒，选择 cookie 匿名用户：
- 0 注册门槛、首次访问就能用，最贴近"工具"体验
- middleware 自动派发 ID，无 onboarding 流程
- 项目仍可分享给任何人（基于 `isPublic`）

如继续投入时间，会用 NextAuth.js + GitHub OAuth 在不破坏匿名体验的前提下"升级"账号（合并匿名期项目）。

### 4. SSE 自定义事件协议 vs `useChat`

`@ai-sdk/react` 的 `useChat` 适合单一对话流，**无法表达多 Agent + 阶段化 + HTML 增量** 三种事件类型混合的语义。所以我用最简的 SSE 协议自己实现了 4 种事件：

```
agent_start  / agent_done   // 阶段状态切换
code_delta   / code_done    // 工程师的流式 HTML 增量与完整产物
message_saved               // 持久化 ack
error                       // 失败兜底
```

前端用 `parseSSE` 生成器解析，状态机映射到 Timeline 与 ChatPanel，逻辑清晰可扩展。

---

## 当前完成度

| 维度 | 状态 |
| -- | -- |
| 首页 + Hero 输入 + 模板入口 + 项目列表 | ✓ |
| 多 Agent 编排可视化（Timeline + 阶段化 prompt） | ✓ |
| 流式生成 + iframe 实时预览 + 代码 Tab | ✓ |
| 项目 CRUD（创建 / 列表 / 删除 / 重命名 API） | ✓ |
| 数据持久化（Prisma + SQLite/Postgres） | ✓ |
| 一键分享页 `/p/[id]` | ✓ |
| 下载 HTML / 复制代码 | ✓ |
| 设备宽度预览切换（Desktop/Tablet/Mobile） | ✓ |
| 匿名用户 cookie + middleware | ✓ |
| 暗色模式（基础变量已写） | 部分（未做 Toggle） |
| 项目重命名 UI | 仅 API 完成 |
| 账号体系 / GitHub OAuth | 未做 |
| 多文件全栈项目生成 | 未做（产物形态收敛） |

---

## 如果继续投入时间，扩展优先级

1. **Race Mode（高优先）** — 同一 prompt 并行调用 `deepseek-chat` 与 `deepseek-reasoner`，UI 让用户挑选最佳版本。和 Atoms 的同名特性直接对齐，工作量约 2h。
2. **更强的迭代体验（高优先）** — 在预览里直接圈选元素 → "把这个按钮改成更大"。需要 iframe-host 通信 + DOM 锚点协议。
3. **资产管理（中优先）** — 用户上传图片，模型生成的 HTML 引用 Vercel Blob URL，让产物不止是纯文本应用。
4. **多文件 / React 项目生成（中优先）** — 接入 Sandpack 或 WebContainer，支持产出真正的小型全栈应用。需要新的 Prompt 协议（文件树 JSON）。
5. **账号体系（中优先）** — NextAuth.js + GitHub OAuth，登录后合并 cookie 匿名期的项目。
6. **Marketplace（低优先）** — 把所有公开项目聚合成画廊，可被 Remix / Fork。这是 Atoms `atoms.dev/explore` 的核心生态机制。
7. **Ads / SEO Agent 等业务侧 Agent（低优先）** — Atoms 平台的延展能力，对 Demo 来说优先级最低。

---

## License

MIT
