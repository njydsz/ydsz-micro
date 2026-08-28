<p align="center">
  <h1 align="center">YDSZ Micro</h1>
  <p align="center">
    基于 Vue 3 · TypeScript · Micro-kernel 的企业级微应用开发平台
  </p>
</p>

<p align="center">
  <img alt="Vue 3" src="https://img.shields.io/badge/Vue-3-42b883" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178c6" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646cff" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-10-f69220" />
  <img alt="Turbo" src="https://img.shields.io/badge/Turbo-Monorepo-000000" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## YDSZ 前端微应用 Monorepo

基于自研 **micro-kernel** 微前端运行时，采用 Vue 3 + Element Plus + TypeScript 技术栈。每个后端微服务对应一个独立的前端微应用，实现「独立开发」「独立测试」「独立部署」。

## 关联仓库

| 平台 | 后端仓库 |
| ---- | -------- |
| Gitee | https://gitee.com/njydsz/ydsz-cloud |
| GitHub | https://github.com/njydsz/ydsz-cloud |

---

## 核心特性

| 特性           | 说明                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **微前端架构** | micro-kernel ESM 直引隔离 + 按需预加载（hover/idle/route/frequency 四策略）+ 全局状态通信（globalState） |
| **多级沙箱**   | 快照沙箱（默认）/ Proxy 沙箱 / iframe 沙箱可选，按子应用配置切换                                         |
| **版本与灰度** | 子应用构建产出 `version.json` / manifest，支持版本管理、按 userId 灰度分流（canary）                     |
| **资源调度**   | keep-alive + LRU 淘汰 + TTL + 内存压力释放 + 可见性自动释放                                              |
| **错误降级**   | 分级降级 + 自动重试 + fallback 渲染（error-boundary）                                                    |
| **路由预测**   | v4.0 基于马尔可夫链的转移概率预测，配合 link-hints（preconnect/modulepreload）与 speculation-rules 预热  |
| **公共认证包** | `@ydsz/shared-auth` 统一 RequestClient + Auth API + Auth Store，消除多份重复代码                         |
| **前端监控**   | `@ydsz/monitor` 错误捕获（Vue/window/Promise/资源）+ Web Vitals（LCP/FID/CLS/INP/FCP/TTFB）              |
| **主题切换**   | auto/light/dark 暗黑模式 + Element Plus 主题适配 + 系统偏好跟随                                          |
| **API 对齐**   | 统一 `/api/v1/*` 路径 + `successCode="A00000"` + LoginVO 类型 + refreshToken 自动刷新                    |
| **构建优化**   | Vite manualChunks 分割（vue-vendor/element-vendor/vxe-vendor）+ chunk hash 缓存                          |
| **国际化**     | 8 子应用 × zh-CN/en-US 双语 + 业务字段翻译 + Element Plus/dayjs 语言包                                   |
| **调试工具**   | 配套 Chrome MV3 DevTools 扩展（chrome/），实时查看内核连接、沙箱状态、事件日志                           |

## 技术栈

| 类别        | 技术                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| 框架        | Vue 3 + TypeScript                                                                     |
| 构建工具    | Vite 6                                                                                 |
| 包管理      | pnpm 10 + Turbo (Monorepo)                                                             |
| 微前端      | micro-kernel（自研 ESM 原生微前端运行时）+ micro-runtime（接口层）                     |
| UI 组件库   | Element Plus 2.10                                                                      |
| 状态管理    | Pinia 3 + pinia-plugin-persistedstate                                                  |
| 路由        | Vue Router 4                                                                           |
| 样式        | Tailwind CSS 3 + SCSS                                                                  |
| HTTP 客户端 | Axios                                                                                  |
| 表单验证    | Vee-validate + Zod                                                                     |
| 图表        | ECharts 5                                                                              |
| 表格组件    | VXE Table 4                                                                            |
| 国际化      | Vue I18n 11                                                                            |
| Mock 服务   | Nitro                                                                                  |
| 测试        | Vitest + happy-dom（单元）、Playwright（E2E/a11y/视觉回归）、Lighthouse CI（性能预算） |
| 代码规范    | ESLint 9 + Prettier + Stylelint + Commitlint + Lefthook（git hooks）                   |

## 架构设计

```
┌──────────────────────────────────────────────────────────────┐
│                    main-web（主应用/宿主）                      │
│         端口 5600  │  认证/布局/全局状态/路由分发/micro-kernel Host       │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────────┐    │
│  │ lite-    │  │ Vue Router │  │ 全局 Store / 偏好 / i18n  │    │
│  │ kernel   │  │ (主路由)   │  │                          │    │
│  │ Host     │  │           │  │                          │    │
│  └────┬─────┘  └─────┬─────┘  └──────────────────────────┘    │
│  ┌────▼───────────────▼───────────────────────────────────┐   │
│  │            子应用挂载容器 (#subapp-container)              │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
    │           │          │          │          │          │          │          │
 ┌──▼──┐    ┌──▼──┐   ┌──▼───┐   ┌──▼───┐   ┌──▼───┐   ┌──▼───┐   ┌──▼───┐   ┌──▼───┐
 │user │    │sys  │   │msg   │   │cron  │   │flow  │   │wiki  │   │rule  │   │agent │
 │center│   │admin│   │center│   │job   │   │design│   │drive │   │engine│   │assist│
 │5601 │    │5602 │   │5604  │   │5605  │   │5606  │   │5607  │   │5608  │   │5610  │
 └─────┘    └─────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘
    │           │          │          │          │          │          │          │
 ┌──▼──┐    ┌──▼──┐   ┌──▼───┐   ┌──▼───┐   ┌──▼───┐   ┌──▼───┐   ┌──▼───┐   ┌──▼───┐
 │:9002│    │:9001│   │:9004 │   │:9006 │   │:9005 │   │:9003 │   │:9007 │   │:9008 │
 └─────┘    └─────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘
```

### 微前端运行时

`comm/effects/micro-kernel`（`@ydsz/micro-kernel`）为自研 ESM 原生运行时，面向「同团队、统一构建链的同源子应用集群」，完整链路为：

```
ESM loader → 生命周期 → 沙箱 → keep-alive → 错误降级 → 路由同步 → 全局通信
```

核心能力：三种沙箱（`sandbox` 快照 / `proxy-sandbox` / `iframe-sandbox`，支持矩阵与 experimental 边界见 [ADR-007](docs/decisions/adr-007-sandbox-matrix.md)）、vite-plugin-manifest（子应用产物清单、版本与 sha256 完整性清单）、远程 registry 注册表 + 缓存、版本管理与灰度分流、资源调度器（keep-alive / LRU / TTL / 内存压力 / 可见性释放，内存优先标准 `performance.measureMemory()`）、分级错误降级、消息总线（sendMessage / sendRequest 请求-响应）、四种预加载策略、路由马尔可夫预测（含 `minSampleSize` 冷启动门槛）与预加载命中率指标回环（`preload-metrics`，数据驱动策略调优）。调试请使用 [chrome/](chrome/) 下的 DevTools 扩展。

## 应用清单

| 应用             | 包名                 | 前端端口 | 后端服务      | 后端端口 | 路由前缀   | 职责                                    |
| ---------------- | -------------------- | -------- | ------------- | -------- | ---------- | --------------------------------------- |
| **main-web**     | `@ydsz/main-web`     | 5600     | YDSZ-gateway  | 9000     | /          | 微前端宿主，认证/布局/全局状态/路由分发 |
| **userinfo-web** | `@ydsz/userinfo-web` | 5601     | YDSZ-userinfo | 9002     | /YDSZ-user | 用户/部门/角色/菜单/岗位/OAuth2         |
| **system-web**   | `@ydsz/system-web`   | 5602     | YDSZ-system   | 9001     | /YDSZ-sys  | 系统配置/字典/变量/应用注册             |
| **message-web**  | `@ydsz/message-web`  | 5604     | YDSZ-message  | 9004     | /YDSZ-msg  | 消息/模板/通知/路由/灰度/追踪           |
| **cronjob-web**  | `@ydsz/cronjob-web`  | 5605     | YDSZ-cronjob  | 9006     | /YDSZ-cron | 任务/DAG/日志/告警/拓扑                 |
| **workflow-web** | `@ydsz/workflow-web` | 5606     | YDSZ-workflow | 9005     | /YDSZ-flow | 流程模板/设计器/实例/待办/SLA           |
| **nextwiki-web** | `@ydsz/nextwiki-web` | 5607     | YDSZ-nextwiki | 9003     | /YDSZ-wiki | 文件/预览/搜索/分享/锁定                |
| **literule-web** | `@ydsz/literule-web` | 5608     | YDSZ-literule | 9007     | /YDSZ-rule | 规则/DSL/变量/CEP/断点                  |
| **agent-web**    | `@ydsz/agent-web`    | 5610     | YDSZ-agent    | 9008     | /YDSZ-ai   | 对话/Agent/RAG/DAG/审批                 |

> 注：`project-web` 已在仓库整合中移除（见提交 `c08336552`），其能力并入主应用相关模块；如仍需项目管理界面，请以 Git 历史或独立分支为准。

## 目录结构

```
ydsz-micro/
├── main/                              # 主应用（微前端宿主 @ydsz/main-web）
│   ├── src/
│   │   ├── 注册表 MICRO_APPS                  # micro-kernel 子应用注册配置
│   │   ├── adapter/                  # Element Plus 组件适配器
│   │   ├── api/                      # 核心 API（auth/user/menu）
│   │   ├── layouts/                  # 布局（basic + auth）
│   │   ├── router/                   # 主路由 + 守卫 + 子应用路由
│   │   ├── store/                    # 全局 Store（auth）
│   │   ├── views/                    # 全局页面（dashboard/login/404/subapp 容器）
│   │   ├── locales/                  # 国际化
│   │   └── preferences.ts            # 偏好覆盖
│   └── ...
├── apps/                              # 8 个业务子应用
│   ├── userinfo-web/                # 用户中心 → YDSZ-userinfo:9002
│   ├── system-web/                  # 系统管理 → YDSZ-system:9001
│   ├── message-web/                 # 消息中心 → YDSZ-message:9004
│   ├── cronjob-web/                 # 定时任务 → YDSZ-cronjob:9006
│   ├── workflow-web/                # 工作流引擎 → YDSZ-workflow:9005
│   ├── nextwiki-web/                # 网盘知识库 → YDSZ-nextwiki:9003
│   ├── literule-web/                # 规则引擎 → YDSZ-literule:9007
│   └── agent-web/                   # AI 助手 → YDSZ-agent:9008
├── comm/                              # 公共共享包（workspace 包）
│   ├── @core/                        # 核心 SDK（base/composables/preferences/ui-kit/feature-flags）
│   ├── effects/                      # 副作用（access/common-ui/hooks/layouts/plugins/request/
│   │                                 #   shared-auth/monitor/micro-kernel/micro-runtime/shared-business）
│   ├── constants/                    # 常量定义
│   ├── icons/                        # 图标配置
│   ├── locales/                      # 国际化基础包
│   ├── stores/                       # 全局状态管理
│   ├── styles/                       # 全局样式
│   ├── types/                        # 类型定义
│   └── utils/                        # 工具函数
├── conf/                              # 工程配置（共享构建/风格/TS 配置）
│   ├── vite-config/                  # Vite 共享构建配置
│   ├── tailwind-config/              # Tailwind CSS 共享配置
│   ├── tsconfig/                     # TypeScript 共享配置
│   ├── lint-configs/                 # ESLint + Prettier + Stylelint + Commitlint
│   └── node-utils/                   # Node.js 工具
├── bash/                              # 脚本工具
│   ├── deploy/                       # Docker 多阶段构建 + nginx 部署
│   ├── turbo-run/                    # Turbo 并行运行
│   └── vsh/                          # 项目运维工具（lint/check-dep/check-circular…）
├── chrome/                            # micro-kernel DevTools（Manifest V3 扩展）
├── e2e/                               # Playwright E2E / a11y / 视觉回归
├── docs/                              # 决策记录（ADR）等
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## 快速开始

### 环境要求

| 依赖    | 版本                                |
| ------- | ----------------------------------- |
| Node.js | >= 20.10.0                          |
| pnpm    | >= 9.12.0（推荐通过 corepack 管理） |

### 安装与启动

```bash
# 1. 启用 corepack（如未启用）
npm i -g corepack

# 2. 安装依赖（仓库强制 pnpm，preinstall 会拦截其他包管理器）
pnpm install

# 3. 启动所有应用（主应用 + 所有子应用）
pnpm dev

# 启动单个应用
pnpm dev:main        # 主应用（端口 5600）
pnpm dev:userinfo    # 用户中心（端口 5601）
pnpm dev:system      # 系统管理（端口 5602）
pnpm dev:message     # 消息中心（端口 5604）
pnpm dev:cronjob     # 定时任务（端口 5605）
pnpm dev:workflow    # 工作流引擎（端口 5606）
pnpm dev:nextwiki    # 网盘知识库（端口 5607）
pnpm dev:literule    # 规则引擎（端口 5608）
pnpm dev:agent       # AI 助手（端口 5610）
```

### 构建

```bash
pnpm build                   # 打包所有应用
pnpm build:main              # 主应用
pnpm build:userinfo          # 用户中心
pnpm build:system            # 系统管理
pnpm build:message           # 消息中心
pnpm build:cronjob           # 定时任务
pnpm build:workflow          # 工作流引擎
pnpm build:nextwiki          # 网盘知识库
pnpm build:literule          # 规则引擎
pnpm build:agent             # AI 助手

pnpm preview                 # 本地预览构建产物
pnpm build:analyze           # 产物体积分析（rollup-plugin-visualizer）
```

### 代码生成

```bash
pnpm gen:api         # 由 OpenAPI 契约生成 API 客户端（--check 校验漂移）
pnpm gen:app         # 脚手架生成新子应用
pnpm gen:nginx       # 生成 nginx 子应用路由配置（--check 校验）
pnpm gen:registry    # 由 MICRO_APPS 注册表生成 micro-kernel registry.json
```

### 常用运维脚本

```bash
pnpm sync:shared-deps        # 同步共享依赖版本
pnpm update:deps             # 交互式升级依赖（taze）
pnpm upload:sourcemaps       # 上传 sourcemap（生产排障）
pnpm reinstall               # 清空 lock 后重装
pnpm clean                   # 清理产物
```

## 路由规则

主应用通过路径前缀匹配激活对应的子应用：

| 路径前缀       | 子应用       |
| -------------- | ------------ |
| `/YDSZ-user/*` | userinfo-web |
| `/YDSZ-sys/*`  | system-web   |
| `/YDSZ-msg/*`  | message-web  |
| `/YDSZ-cron/*` | cronjob-web  |
| `/YDSZ-flow/*` | workflow-web |
| `/YDSZ-wiki/*` | nextwiki-web |
| `/YDSZ-rule/*` | literule-web |
| `/ydsz-ai/*`   | agent-web    |

## API 代理与对齐

开发环境通过 Vite proxy 统一代理到 Gateway 9000 端口：

```typescript
// vite.config.mts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:9000',  // Gateway
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      ws: true,
    },
  },
}
```

全仓 API 契约统一对齐：

- 路径统一为 `/api/v1/{service}/{resource}`（kebab-case），成功码统一为 `successCode = "A00000"`
- 登录响应统一为 `LoginVO` 类型，`refreshToken` 自动刷新与重放
- **契约门禁**（CI 防漂移）：
  - `pnpm gen:contract`：从 `ydsz-cloud` 源码静态提取 8 个服务全部端点，生成 `apps/*/src/api/` 下的类型化 API 封装（`models.ts` 含全部 DTO/VO 类型）与 `sdk/openapi.json` 契约基线，产物扁平落于 `api/` 根目录（遵循云顶编码规范 6.2）
  - `pnpm gen:contract:check`：校验后端接口变更是否已同步（有漂移则退出码非 0），建议挂入 CI
  - `pnpm gen:api` / `gen:api:check`：后端运行后从 `/v3/api-docs` 拉取运行时契约生成 SDK，可无缝替换静态基线
- 业务代码按模块 import 真实契约 API，如 `import { list as listRules } from '#/api/ruleAdmin'`；`#/api` 聚合导出仅保留 `core`（认证/菜单/用户）与 `models`，避免多 Controller 重名函数（get/stats/validate）的导出歧义
- **流式接口**：agent `chat/stream`、`execute/stream` 等 SSE 场景使用 `streamRequest`（`@ydsz/shared-auth`，fetch + ReadableStream 解析，Token 自动注入、支持 AbortSignal 取消）

## 工程规范

| 检查项     | 命令                          | 说明                                          |
| ---------- | ----------------------------- | --------------------------------------------- |
| Lint       | `pnpm lint` / `pnpm lint:fix` | ESLint + Stylelint（含 Stylelint 自动修复）   |
| 类型检查   | `pnpm type-check`             | turbo 编排（⚠️ 各包 `type-check` 脚本尚未接线，当前执行 0 任务；存量类型错误清理后逐包接线） |
| 循环依赖   | `pnpm vsh:check-circular`     | `vsh check-circular`（零循环依赖守护）        |
| 依赖合法性 | `pnpm vsh:check-dep`          | `vsh check-dep`（依赖合规）                   |
| 产物依赖   | `pnpm vsh:check-bundle`       | 共享依赖外置证据检测（防 importmap 依赖被误打包致双实例，v4.4.0） |
| 产物体积   | `pnpm check:size`             | 构建产物 gzip 预算断言（主应用 512KB / 子应用 384KB，v4.4.0） |
| i18n 校验  | `pnpm check:i18n`             | 全仓 zh-CN / en-US key 集合一致性校验（v4.4.0） |
| importmap  | `pnpm sync:shared-deps:check` | 版本锁（`bash/importmap.lock.json`）与 vendor 产物一致性校验（v4.4.0） |
| 契约校验   | `pnpm gen:contract:check`     | 静态契约基线漂移检查；`pnpm gen:api:check` 为运行时契约（后端运行后） |
| 发布校验   | `pnpm vsh:publint`            | 共享包发布规范校验                            |
| 格式化     | —（待接入）                   | Prettier 经 `lint:fix` 集成，独立 `format` 脚本未落地 |
| 拼写检查   | —（待接入）                   | `cspell` 配置未落地，`check:cspell` 脚本缺失  |

Git hooks（Lefthook）：`pre-commit` 并行执行 Prettier/ESLint/Stylelint 及 JSON 格式化；`pre-push` 执行单元测试、类型检查与 `pnpm audit` 安全审计；`commit-msg` 执行 Commitlint；`post-merge` 自动 `pnpm install`。

CI（GitHub Actions，v4.4.0 起落地）：`verify` job（lint / stylelint / test / check-circular / check-dep / check:i18n / sync:shared-deps:check）PR 必跑；`contract` job（`gen-contract.py --check`，经 `YDSZ_CLOUD_ROOT` 检出后端）push main 必跑；`e2e-smoke` job（build + check:size + check-bundle + Playwright 冒烟）手动触发。

## 测试体系

| 层级       | 命令                          | 覆盖范围                                                                                 | 状态 |
| ---------- | ----------------------------- | ---------------------------------------------------------------------------------------- | ---- |
| 单元测试   | `pnpm test` / `pnpm test:coverage` | Vitest + happy-dom（micro-kernel / request / shared-auth 等包自持配置），覆盖率门槛已在根配置声明（branches/functions 70% / lines 80%） | ✅ 已落地 |
| 契约测试   | `pnpm gen:contract:check`     | API 契约对齐（静态提取基线 `--check` 校验漂移）                                          | ✅ 已落地 |
| E2E 冒烟   | `pnpm test:e2e`               | Playwright：主应用启动/路由可达/无致命异常（`e2e/specs/main-smoke.spec.ts`，v4.4.0）     | ✅ 已落地（CI 手动触发） |
| 可访问性   | `pnpm test:e2e`（同一套件）   | 登录页 axe 扫描（wcag2a/wcag21a，critical=0 基线，见 ADR-005）                           | ✅ 基线落地 |
| 视觉回归   | —（待接入）                   | `e2e/visual-regression.spec.ts` 尚未创建                                                 | ⚠️ 待接入 |
| 性能预算   | `pnpm test:perf`              | Lighthouse CI（lighthouserc.json，3 次采样，desktop preset）；另有产物级 `check:size`   | ✅ 已落地 |

## 性能预算

> 由 `pnpm test:perf`（Lighthouse CI，3 次采样，desktop preset，`lighthouserc.json`）执行；产物级预算由 `pnpm check:size` 与构建期 bundle-budget 插件兜底。预算目标如下：

- **错误级**：Accessibility ≥ 0.9
- **警告级**：Performance ≥ 0.9；FCP ≤ 2000ms、LCP ≤ 2500ms、TTI ≤ 3800ms、TBT ≤ 300ms、CLS ≤ 0.1、SI ≤ 3400ms
- **资源预算**：JS ≤ 50 个 / 512KB，CSS ≤ 10 个 / 128KB，图片 ≤ 1MB，第三方 ≤ 256KB，DOM 节点 ≤ 1500

## 浏览器支持

支持现代常青浏览器（Chrome 80+ / Edge / Firefox / Safari），不支持 IE。

## Git 规范

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)（Commitlint 强制校验）：

- `feat` 增加新功能
- `fix` 修复问题/BUG
- `style` 代码风格相关无影响运行结果的
- `perf` 优化/性能提升
- `refactor` 重构
- `revert` 撤销修改
- `test` 测试相关
- `docs` 文档/注释
- `chore` 依赖更新/脚手架配置修改等
- `ci` 持续集成

> 提交时建议使用 `pnpm commit`（czg 交互式引导）。

## 文档与决策记录

- [docs/v4.0-优化设施说明.md](docs/v4.0-优化设施说明.md) — 微应用框架优化设施说明（v4.0-v4.4）
- [docs/decisions/](docs/decisions/README.md) — 架构决策记录（ADR 索引）：
  - [ADR-001: 微前端运行时选型](docs/decisions/adr-001-micro-kernel-vs-qiankun.md)（自研 ESM 内核 vs qiankun）
  - [ADR-002: Monorepo 工具链](docs/decisions/adr-002-monorepo-toolchain.md)（pnpm + turbo + vsh）
  - [ADR-003: SSR / Pre-rendering 评估](docs/decisions/adr-003-ssr-pre-rendering.md)
  - [ADR-005: 可访问性基线](docs/decisions/adr-005-accessibility.md)（axe E2E）
  - [ADR-006: 可观测性体系](docs/decisions/adr-006-observability.md)（错误/性能/预加载指标）
  - [ADR-007: 三沙箱支持矩阵](docs/decisions/adr-007-sandbox-matrix.md)（iframe 沙箱为 experimental）

## 竞品对标

YDSZ 微前端中后台底座的对标竞品均为 Gitee 上的 Java/Spring 系中后台框架，可作为产品定位、能力补齐与差异化分析的参考：

| 竞品 | 定位 | Gitee 地址 |
| ---- | ---- | ---------- |
| **RuoYi** | 基于 Spring Boot 的轻量级权限管理 / 快速开发框架 | https://gitee.com/y_project/RuoYi |
| **pig** | 基于 Spring Cloud、OAuth2 的 RBAC 企业级快速开发平台（微服务 / 单体双模） | https://gitee.com/log4j/pig |
| **maku-boot** | 企业级低代码平台（前后端分离，信创适配） | https://gitee.com/makunet/maku-boot |
| **SpringBlade** | 商业级微服务 SaaS（Vue/React 双前端） | https://gitee.com/smallc/SpringBlade |
| **JeecgBoot** | 企业级 AI 低代码平台（低代码 + 零代码双模式） | https://gitee.com/jeecg/JeecgBoot |

**差异化要点**：上述竞品普遍为「后端全家桶 + 单体/微服务」形态，YDSZ 的核心差异在 **Vue 3 微前端架构**（`micro-kernel` + 8 个独立部署子应用）、**agent-web AI Agent 原生**、**可观测性**（火焰图 / 时间线 / 内存趋势，ADR-006）与 **可访问性**（屏幕阅读器测试，ADR-005）；**信创适配**（国密、达梦 / 人大金仓等国产库）为对标中普遍具备、YDSZ 尚待补齐的能力。

## Roadmap

- [ ] 接入 CI/CD 流水线（~~已完成主链路~~ v4.4.0：GitHub Actions `verify` / `contract` 已落地，`e2e-smoke` 手动触发；待办：e2e 放开至 PR 必跑、cspell 接入）
- [x] 补齐 Changesets 发布配置（v4.4.0：`.changeset/` 已初始化）
- [x] 补全 ADR 决策记录（v4.4.0：ADR-001/002/003/005/006/007 已归档，004 编号跳过）
- [ ] 共享依赖版本锁推广：`pnpm sync:shared-deps` 生成 `bash/importmap.lock.json` 后提交，各应用 vendor 产物对齐（v4.4.0 机制已落地，待首次执行）
- [ ] manifest 签名验签升级：当前 strictIntegrity 为 sha256 清单比对（可选模式），后续评估 HMAC/ed25519 签名与 Service Worker 校验
- [x] 移除 `project-web` 相关残留引用（package.json 脚本 / 部署配置 / e2e 用例）

## 开源许可

[MIT](LICENSE) © 2026 Marvin Lee
