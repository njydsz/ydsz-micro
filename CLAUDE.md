# CLAUDE.md — ydsz-micro AI 编码规则

> **本文件为 AI 编码助手（Claude Code / Cursor / Windsurf / Aider / CatPaw）的 `always` 规则。**
> 任何 AI 编码助手在本项目中编程时，都必须遵守本文件中的规则。
>
> **规范版本**: v1.0.0
> **eslint.config.mjs**: 层级约束、EP 退场门禁、TS 回潮门禁的单一权威源

---

## 项目速览

| 维度 | 描述 |
|------|------|
| 产品 | ydsz-micro（云顶云微前端 Monorepo）|
| 包管理 | pnpm >= 9.12（catalog 集中版本管理）+ Turborepo |
| 语言 | TypeScript ^5.8.3（全仓 TypeScript，**禁止 .js/.mjs 回潮**）|
| 框架 | Vue ^3.5.17（Composition API + `<script setup>`）|
| 状态 | Pinia ^3.0.3 + pinia-plugin-persistedstate |
| 路由 | vue-router ^4.5.1（webhash / web history 双模式）|
| 样式 | Tailwind CSS ^3.4 + @ydsz-core/design-tokens（CSS 变量主题体系）|
| UI Kit | @ydsz-core/ydsz-ui（shadcn-vue 风格，radix-vue 分叉）|
| 国际化 | vue-i18n ^11.1（延迟绑定 `$t`、命名空间按需加载）|
| HTTP 封装 | @ydsz/request（successCode="A00000" + 自动刷新 Token）|
| 微前端 | @ydsz/micro-kernel（自研 ESM 原生运行时，非 qiankun）|
| 测试 | Vitest ^3.2 + @vue/test-utils + happy-dom；E2E 用 Playwright |
| Lint | ESLint 9 扁平配置 + commitlint + stylelint + prettier |
| Node | >= 20.10.0 |

---

## 模块拓扑

```
ydsz-micro/
├── apps/               # 子应用层（L3）：system-web / userinfo-web / agent-web / ...
│   └── <app>/src/      # 适配器 ─ api ─ components ─ composables ─ layouts ─ locales ─ router ─ store ─ views
├── main/               # 微前端主壳（kernel host）
│   └── src/            # setup/ 装配 + widgets/ + bootstrap 编排
├── comm/               # 公共能力层
│   ├── @core/          # L0：ui-kit(ydsz-ui/ydsz-vue/popup-ui/...) + composables + base + components + feature-flags + preferences
│   ├── constants/ stores/ styles/ types/ utils/ icons/ locales/ preferences/   # L1
│   └── effects/        # L2：request / access / shared-auth / shared-business / hooks / layouts / monitor / notification / plugins / common-ui / micro-kernel / micro-runtime / mock-service
├── conf/               # 共享配置：lint-configs / vite-config / tailwind-config / tsconfig / eslint-config ...
├── bash/               # 门禁 + 生成器 + 工具脚本
└── tests/              # playwright e2e / visual / perf / a11y 配置
```

### DDD-like 四层依赖方向（eslint.config.mjs 硬约束）

```
L0 comm/@core/*        ← 禁止引用 L1/L2/L3
L1 comm/{constants,stores,styles,types,utils,icons,locales,preferences}  ← 禁止引用 L2/L3
L2 comm/effects/*      ← 禁止引用 L3
L3 apps/*              ← 禁止横向引用其他 apps/*
```

> main/ 作为壳应用引用全部层；apps/ **严禁**横向互相引用，跨应用共享能力必须下沉到 `comm/effects` 或 `comm/@core`。

---

## 编码红线（强制）

### Import 约束

| 规则 | 要求 |
|------|------|
| IMP-001 | comm/* 包必须从桶文件（`@ydsz/xxx` 或相对 `src/index.ts`）引用，**禁止深入包内部路径**（如 `@ydsz/request/error-codes`）|
| IMP-002 | apps/ 代码统一使用 `#/` 子路径别名（由 `package.json#imports` 映射到 `./src/*`）|
| IMP-003 | **EP 退场门禁**：apps/ 与 main/ 禁止 `import ... from 'element-plus'`、`element-plus/*`、`@element-plus/icons-vue`；组件请使用 `@ydsz-core/ydsz-ui`；命令式 API 请使用 `@ydsz-core/popup-ui`；图标请使用 `lucide-vue-next` 或 `@ydsz/icons` |
| IMP-004 | **TS 回潮门禁**：禁止在 apps/ comm/ bash/ main/ 源码目录新增 `.js` / `.mjs` 文件 |
| IMP-005 | 业务代码禁止直接 import axios；必须从 `@ydsz/request` 导出 |
| IMP-006 | 禁止引入 `element-plus`（via eslint no-restricted-imports error 级）|

### 命名

| 规则 | 要求 |
|------|------|
| NAM-001 | SFC 文件名：PascalCard（views/ 内），kebab-case（composables/ 内）|
| NAM-002 | 组件 `defineOptions({ name: 'XxxYyy' })` 必填（Router KeepAlive / DevTools 依赖）|
| NAM-003 | Store：`useXxxStore` 命名 + `defineStore('xxx', ...)` |
| NAM-004 | API 函数：camelCard（如 `page`、`getById`、`save`、`remove`、`exportData`）|
| NAM-005 | i18n key：`<module>.<page>.<element>` 点分命名（如 `dictType.filter.name`）|
| NAM-006 | route name：PascalCard 与组件 name 对齐 |
| NAM-007 | 测试文件：与源文件同目录、同名 `.test.ts` 伴生 |

### SFC 与组件

| 规则 | 要求 |
|------|------|
| SFC-001 | **必须** `<script lang="ts" setup>`，未提供选项时用 `defineOptions` 补 name |
| SFC-002 | Props/Emits 用 TypeScript 泛型语法（`defineProps<{ ... }>()` / `defineEmits<{ ... }>()`）|
| SFC-003 | 模板中 i18n 用 `t('key')`（从 `useI18n()` 解构）或全局 `$t`（模板直接使用）|
| SFC-004 | 模板中禁止硬编码中文文案，必须走 i18n key |
| SFC-005 | 样式使用 Tailwind 工具类优先；组件库 token 使用 `bg-primary text-foreground` 等 design-token 变量 |
| SFC-006 | 避免 SFC 超过 500 行；超出时抽取 composables 或子组件 |

### 状态与 API

| 规则 | 要求 |
|------|------|
| PIN-001 | Pinia store `defineStore` 必须带明确 name（HMR / DevTools 依赖）|
| PIN-002 | 持久化用 `pinia-plugin-persistedstate`，不允许手写 localStorage 包装 |
| API-001 | 后端契约变更后运行 `python bash/gen-contract.py <app>` 重新生成；禁止手改 `src/api/models.ts` 与生成件 |
| API-002 | 所有 HTTP 请求必须通过 `requestClient`（来自 `@ydsz/request`），禁止裸 `fetch` / `axios`（SSE 场景用 `streamRequest` 除外）|
| API-003 | 请求返回的 success 判断：`code === 'A00000'`（requestClient 已内置）|
| API-004 | 错误码常量从 `@ydsz/request` 的 `ErrorCode` 枚举取值，禁止手写字符串 |

### 微前端架构

| 规则 | 要求 |
|------|------|
| MFA-001 | main 壳通过 `@ydsz/micro-runtime` 注册子应用；子应用通过 `@ydsz/shared-auth` 的 `createSubApp` / `createSubAppI18n` 装配 |
| MFA-002 | 子应用禁止直访问 main 壳的 Pinia store；跨应用通信使用 `notifyCrossTab` 或 message-broker |
| MFA-003 | 子应用路由使用 `initRoutes` + `createRouterGuard`（来自 `@ydsz/shared-auth`），不要自行重新实现 |
| MFA-004 | 子应用 i18n 通过 `createSubAppI18n({ modules: import.meta.glob('./langs/**/*.json') })` 装配 |

### 国际化

| 规则 | 要求 |
|------|------|
| I18N-001 | 词条文件位于 `src/locales/langs/<locale>/<namespace>.json`（扁平 JSON）|
| I18N-002 | 支持 zh-CN / en-US / es-ES / fr-FR / ja-JP / ko-KR 六种语言 |
| I18N-003 | 禁止在模板或 TS 中硬编码中文文案（UI 层使用 i18n key）|
| I18N-004 | 错误码提示文案从后端错误码 i18n key 读取，禁止前端重新硬编码错误描述 |
| I18N-005 | `pnpm check:i18n` 门禁会发现缺失词条，必须清零 |

### 样式

| 规则 | 要求 |
|------|------|
| STL-001 | 优先使用 Tailwind 工具类；自定义值必须使用 design-token 变量 |
| STL-002 | 组件库 token 变量：`bg-primary`、`text-muted-foreground`、`border-border` 等 |
| STL-003 | Prettier 通过 `prettier-plugin-tailwindcss` 自动排序 class（`pnpm format`）|
| STL-004 | 禁止直接修改 `comm/@core/ui-kit/ydsz-vue` 上游 fork 文件（上游同步冲突豁免）|

---

## 测试规范

| 工具 | 命令 | 说明 |
|------|------|------|
| 单元测试 | `pnpm test:unit` | vitest run（配置：`vitest.config.ts`，env=happy-dom）|
| 单元监听 | `pnpm test:unit:watch` | vitest（watch 模式）|
| 覆盖率 | `pnpm test:coverage` | + v8 覆盖率；阈值 lines 25 / branches 15 / functions 20 / statements 25 |
| E2E | `pnpm test:e2e` | playwright（chromium / firefox / webkit）|
| E2E smoke | `pnpm test:e2e:smoke` | 仅 chromium |
| 视觉回归 | `pnpm test:visual` | playwright.visual.config.ts |
| 可访问性 | `pnpm test:a11y` | axe-core + playwright |
| 性能 | `pnpm test:perf` | playwright.perf.config.ts |

**测试伴生文件**：`apps/*/src/views` 与 `apps/*/src/components` 下的 `.vue` 须有同名 `.test.ts`（eslint test-companion 插件会警告）。

---

## 常用命令

```bash
# 开发
pnpm dev                          # 全部（turbo-run）
pnpm dev:system                   # 单应用（pnpm -F @ydsz/system-web run dev）

# 构建
pnpm build                        # turbo 全量构建
pnpm build:system                 # 单应用构建

# Lint / 格式
pnpm lint                         # ESLint（--max-warnings=0 阻断）
pnpm lint:fix
pnpm format                       # prettier --write
pnpm type-check                   # 所有应用 type-check
pnpm type-check:strict            # turbo type-check
pnpm stylelint

# 生成器
pnpm gen:api                      # OpenAPI api 生成
pnpm gen:contract                 # 后端契约 Python 生成器（models.ts + api/*.ts）
pnpm gen:error-codes              # 错误码前端枚举生成
pnpm gen:api:i18n                 # api i18n 增量同步

# 门禁
pnpm check:ci                     # CI 综合检查
pnpm check:exports                # named export 校验
pnpm check:i18n                   # i18n 词条完整性
pnpm check:ui-text                # 硬编码中文
pnpm check:tpl                    # template-prop 门禁
pnpm check:size                   # 打包体积回归
pnpm check:deps                   # 隐式依赖声明校验
pnpm check:tokens                 # design token Figma 同步校验

# 其他
pnpm test:unit                    # Vitest
pnpm test:coverage                # +v8 覆盖
pnpm test:e2e                     # Playwright
```

---

## Git 提交规范

遵循 Conventional Commits，由 `commitlint.config.mjs` + lefthook 强制：

```
type(scope): subject

type: feat | fix | style | perf | refactor | revert | test | docs | chore | ci
scope: 包名/模块名（如 system-web、ydsz-ui、micro-kernel）
subject: 中文祈使句，50 字符以内
```

---

## AI 行为约束（修改代码时必做）

1. **每次新建文件必须 UTF-8 无 BOM**
2. **每次改动跑 `pnpm lint` 对涉及文件零 warning**（--max-warnings=0 即阻断）
3. **每次改动跑 `pnpm type-check` 对涉及应用零错误**（或 `pnpm -F @ydsz/<app> type-check`）
4. **新增 comm/* 内部逻辑** 后必须通过 eslint 层级约束（L0→L1→L2→L3）
5. **新增 SFC** 必须加 `defineOptions({ name: '<PascalName>' })`
6. **新增 views/components 下 SFC** 必须伴随 `.test.ts` 伴生文件
7. **API 契约文件**（models.ts / api/*.ts 头部标注 DO NOT EDIT）**禁止手改**；应改动后端 then `python bash/gen-contract.py <app>` 重新生成
8. **禁止手造错误码常量**；必须 `pnpm gen:error-codes` 从后端枚举静态扫描生成
9. **禁止在 apps/ main/ 中新增 `from 'element-plus'` import**；EP 已退场（v5.0.0）
10. **禁止新增 `.js` / `.mjs`** 源码文件（根级工具配置豁免 eslint 插件已列出）
11. **禁止 apps/* 横向互相引用**；跨应用能力下沉到 `comm/effects` 或 `comm/@core`
12. **禁止在 apps 层重写微前端 runtime / store / guard 骨架**；统一用 `comm/effects/shared-auth`、`micro-kernel`、`micro-runtime` 封装
13. **禁止在 SFC 模板 / TS 逻辑中硬编码中文**；必须使用 i18n key
14. **禁止 `fetch`/`axios` 裸请求**；必须用 `requestClient`（来自 `@ydsz/request`）
15. **不确定包/函数位置时 grep 全局再落笔**； comm/* 大量 barrel export，命名容易混淆
16. **修改 design-tokens 变量名前** 必须 `pnpm tokens:check` 同步 Figma
17. **新增依赖** 必须先在 `pnpm-workspace.yaml` catalog 中声明统一版本

---

## AI 决策树（新增功能 SOP）

### 新增「页面功能」

```
[新增页面功能]
  │
  ├─ 后端契约是否已存在？
  │   ├─ 是 → pnpm gen:contract:check 确认最新；否则 python bash/gen-contract.py <app>
  │   └─ 否 → 先在后端 ydsz-cloud 定义 Controller
  │
  ├─ views/<模块>/index.vue（主页面 SFC）
  │   └─ defineOptions({ name: '<ModuleManagement>' })
  │   └─ 模板中文全部用 t('module.page.xxx')
  │
  ├─ API 调用走 `requestClient`（来自 @ydsz/request），from '#/api/...'
  │
  ├─ i18n key 预填到全部 6 语言 zh-CN / en-US / es-ES / fr-FR / ja-JP / ko-KR
  │   └─ 缺失词条走 check:i18n 门禁（warning 即阻断）
  │
  ├─ 新增错误码 → pnpm gen:error-codes（后端枚举静态扫描）
  │   └─ 前端 import { ErrorCode, getErrorMessage } from '@ydsz/request'
  │
  ├─ 新增路由：router/routes/modules/<模块>.ts
  │   └─ 同步 router/guard.ts 权限拦截
  │
  ├─ 添加伴生 .test.ts 测试文件（test-companion 门禁）
  │
  └─ pnpm lint + pnpm -F @ydsz/<app> type-check 清零后提交
```

### 新增「公共能力（comm/ 层）」

```
[新增公共能力]
  │
  ├─ 评估层级：L0 @core / L1 (constants等) / L2 effects
  │   ├─ L0（UI kit / composables / feature-flags）→ 禁止引用 L1/L2/L3
  │   ├─ L1（constants/stores/styles/types/utils/icons/locales/preferences）→ 禁止引用 L2/L3
  │   └─ L2（effects/*）→ 禁止引用 L3（apps）
  │
  ├─ exports.Glob 必须从桶入口 src/index.ts re-export
  │   └─ 业务代码用 `@ydsz/xxx` 引用，禁止 `@ydsz/xxx/src/...`
  │
  └─ 新增 barrel export 后 pnpm check:exports 校验 named export 一致
```

### 新增「跨子应用共享逻辑」

```
[跨应用共享逻辑]
  │
  ├─ 下沉到 comm/effects/*（若与认证相关 → @ydsz/shared-auth；若与业务相关 → @ydsz/shared-business）
  ├─ 子应用通过 @ydsz/xxx 桶入口引用
  └─ 禁止 apps/ 横向 import
```

---

## 禁止事项（常见 AI 陷阱）

1. **禁止** 手改 `bash/gen-contract.py` 标注 DO NOT EDIT 的 api/*.ts 与 models.ts
2. **禁止** 在 SFC 模板中写业务逻辑（抽取 composables）
3. **禁止** 直接 new axios 实例（必须走 requestClient）
4. **禁止** 在 main 壳挂载前调用依赖 Pinia/i18n 的能力（bootstrap 时序）
5. **禁止** 在 comm/@core/* 引入 apps/ 层代码
6. **禁止** 在 apps/* 中重写微前端 kernel 与生命周期
7. **禁止** `import ... from 'element-plus'`（EP 已退场）
8. **禁止** 硬编码中文文案（含模板、控制台日志、错误消息）
9. **禁止** 跳过 `pnpm lint --max-warnings=0` 就声称修改完成
10. **禁止** 跳过 `pnpm type-check` 就声称修改完成
11. **禁止** 在 `apps/*/src/views` 或 `apps/*/src/components` 新增 SFC 时不添加 `.test.ts` 伴生文件
12. **禁止** 直接使用 `console.log/debug` 在业务代码中输出；监控场景使用 `@ydsz/monitor` 的 `console.warn/error`
