# YDSZ Micro 全维度优化路线图（2026-10-04）

> **对标对象**：字节飞书/钉钉宜搭、阿里低代码/ProCode、美团内部组件库、GitHub 上万星前端 monorepo（Turborepo/Nx 官方样板）  
> **分析范围**：ydsz-micro 前端仓库（pnpm + Turborepo + Vue 3 + micro-kernel 微前端）+ ydsz-cloud 后端仓库  
> **评估维度**：数据库表 / 接口测试 / 前后贯通 / 架构优化 / 功能增强 / 性能提升 / 体验改善  
> **代码基准**：frontend catalog 版本（vitest 3.2 / vue 3.5 / vite 6.3 / playwright 1.49 / typescript 5.8）+ backend 近期 BUILD SUCCESS

---

## 一、当前状态基线

### 1.1 仓库规模

| 维度 | 数值 | 说明 |
|------|------|------|
| 前端子应用 | 9 + 1 主壳 | agent/cronjob/generator/literule/message/nextwiki/system/userinfo/workflow + main |
| comm 共享模块 | 12 个包 | effects（8 子域）+ icons/locales/preferences/stores/styles/types/utils |
| 前端 Vue/TS 文件 | ~840 | 407 apps + 433 comm；不含 main |
| 后端业务模块 | 10 个 Spring Boot 服务 | 9 业务 + common |
| i18n 资源 | 8 子应用 × 3 locale | 中英三份 |
| 编码规范条款 | 19 章 + changeset + ADR 001-008 | v1.0.3 |
| 共享规则（catpaw-always） | 164+ 条 | P0/P1/P2 三档 |

### 1.2 已建成能力

| 领域 | 能力 | 对标判断 |
|------|------|---------|
| **微前端内核** | 自研 micro-kernel（iframe / proxy / canary / preload / skeleton / page-cache / route-predictor / scheduler / health-check） | 对齐 qiankun/icstark，且具备预测预热独家能力 |
| **API 契约** | unified-contract 统一入口 + openapi-typescript 生成 schema.d.ts + SDK client + hash lock + CI 漂移检测 + 三源降级 | 对齐 APIHub / CBOR |
| **请求层** | axios + 成对 client + 401 无感刷新 + 并发排队 + 指数退避重试 + 业务代码化 + 弃用拦截器 | 对标美团/字节中台标配 |
| **监控体系** | 自研 error-monitor（离线队列 + 面包屑 + 会话上下文）+ Sentry 软对接 + web-vitals + performance-tracker（火焰图/Memory） | 对标 Sentry + Lighthouse CI 自建版 |
| **状态管理** | Pinia + pinia-plugin-persistedstate + secure-ls 加密 + CrossTab 多标签同步 | 有加密存储优势 |
| **质量门禁** | ESLint 零告警 + Stylelint + cspell + commitlint + lefthook + turbo cache | 对标业界黄金 hook 链 |
| **CI Pipeline** | verify / accessibility / contract / security / visual / bundle 六 job 矩阵 | 多维卡点齐全 |
| **无障碍** | @axe-core/playwright WCAG 2.1 AA serious/critical 阻断 | 达到大厂合规门槛 |
| **视觉回归** | Playwright toHaveScreenshot() 像素级基线 | 对齐 Chromatic 免费版 |

---

## 二、各维度优化建议（按优先级排序）

---

### 2.1 接口测试 / 契约测试（P0 — 与 Phase 1 测试战略直接衔接）

#### 现状

- Vitest CI 门禁已启用（`pnpm test:unit`），但仓库当前只有 2 个 spec 文件（a11y、visual smoke），单元测试覆盖率实质 ≈ 0。
- `comm/effects/shared-business/src/composables/use-dict-event.test.ts` 是唯一的真实业务测试。
- 后端 `mvn compile` 至今未跑单元测试。
- 后端模块间集成测试缺失。

#### 对标差距

- 美团中台 ≥ 60% 覆盖为核心模块准入门。
- 字节飞书前端核心逻辑 UT 覆盖率要求 ≥ 70%。
- 阿里省牵牛花 ProCode 要求契约测试（Pact 风格）100% 覆盖 BFF 边界。

#### 可落地动作

| 序号 | 动作 | 工作量 | 预期收益 |
|------|------|--------|----------|
| 1 | **comm/effects/request 单测补齐**：覆盖 retryResponseInterceptor（指数退避 + jitter 时序）、authenticateResponseInterceptor（并发排队 + 刷新失败分支）、defaultResponseInterceptor（codeField/successCode 分支）。使用 vitest fakeTimers + msw mock | 3 人日 | 拦截器核心覆盖 ≥ 80%，CI 有实质产出 |
| 2 | **comm 基础 util 函数补齐**：tree/diff/date/merge/unique/get/set/cn、MaskUtils、ValidationUtils 纯函数覆盖 | 2 人日 | comm 基础库 ≥ 70% |
| 3 | **组合式测试**：useCrudTable / useDictEvent / useServerPagination / use-app-config，用 Vue Test Utils + pinia 工厂 | 2 人日 | 业务 hook 范式可验证 |
| 4 | **契约测试层**：基于生成的 schema.d.ts + openapi.json，引入 `openapi-schema-validator` 在 CI 中校验请求/响应样例（JSON Schema 层面），不依赖后端运行 | 1 人日 | 漂移检测升级为结构约束 |
| 5 | **后端高价值 Service 引入 JUnit 5 + Mockito + Testcontainers** | 5 人日 | 后端模块覆盖率 ≥ 40% |
| 6 | **Pipeline 集成**：单测质量门禁放在 pre-push（已有）+ CI verify 中强化；Vitest v8 → lcov → HTML 可视化 | 调整阈值即可 | Phase 1 战略闭环 |

---

### 2.2 前后贯通（P0 — 契约 + 错误码联动）

#### 现状

- `unified-contract.mjs` 已统一 OpenAPI spec 三源降级，CI 漂移检查覆盖 8 服务。
- 错误码契约（`gen-error-codes.mts`）也已接入 CI --check。
- 但错误码前端消费仍依赖后端静态 `error-codes.generated.ts` 元信息做文案映射，当后端错误码 properties 文案与前端 `$t('error.xxx')` 不一致时产生二次映射断链。
- 部分子应用还保留 `.generated-archived/` 目录（system-web 含 19 文件），旧轨 SDK 迁移尚未 100% 收尾。

#### 对标差距

- 美团/字节要求：**新增接口必须前端先写 mock → 后端实现 → CI 对比通过**，反向检测。
- 阿里省牵牛花 ProCode 要求：错误码由平台统一定义，consumer 静态导入。

#### 可落地动作

| 序号 | 动作 | 工作量 | 预期收益 |
|------|------|--------|----------|
| 1 | **清理 `.generated-archived/`**：核验新 SDK 路径已覆盖既有 API 调用后归档或删除；避免双轨 drift | 0.5 人日 | 代码整洁度 |
| 2 | **错误码联动**：后端 `BusinessException` 走 `i18n_message` 表；前端 `error-codes.generated.ts` 作为兜底 map；推动 error-code 走中心化配置中心（与 `common/config` 对齐） | 3 人日（1 前端 + 2 后端） | 割裂风险归零 |
| 3 | **运行时 spec 热加载**：dev/standalone 模式下增加 live spec 红屏校验，任何编译期遗漏的接口在 dev server 启动即暴露 | 1 人日 | 上线前发现 final-mile 漂移 |
| 4 | **MSW 自动化生成**：基于 openapi-typescript 产物自动生成 msw handler 骨架（已有 mock-service 包，需升级对接） | 2 人日 | 前端可独立联调 + 测试脱离 testcontainer |
| 5 | **Breaking Change 分级通知**：CI `gen:api --check` 输出结构化 diff（新增 / 移除 / 字段收紧）；`contract-notify.mts` 升级为分级通知（removal 即 P0 通知全员） | 1 人日 | 沟通成本下降 |

---

### 2.3 架构优化（P1 — 技术债清理 + 能力升级）

#### 现状

- 自定义 micro-kernel 非常完整；预测预热、canary、iframe/proxy 双沙箱、skeleton 骨架屏均为差异化能力。
- `comm/effects/*` vs `comm/@core/*` 双入口存在部分能力横跨重叠（如 utils/date、color）。
- `comm/effects/shared-auth` 提供完整 SSO + tab-sync + guards，但各子应用 main.ts 仍各自样板式调用 `initSharedRequest`。
- vendor 外置仅限 main 壳；子应用打包完全重复 vendor。

#### 对标差距

- 字节飞书 / 阿里低代码：主壳 vendor 外置 + 子应用共享 runtime，bundle 下降 40%-60%。
- Nx 20+ / Turborepo 官方样板：`targetDefaults` + `inputs` 精细化缓存，本地增量构建 < 3s。

#### 可落地动作

| 序号 | 动作 | 工作量 | 预期收益 |
|------|------|--------|----------|
| 1 | **vendor 外置扩展到子应用**：pinia/vue/vue-router/vxe-table/echarts 通过 `importmap.lock.json` 在子应用构建时也 external；`vite-config/src/` 增加子应用 preset | 3 人日 | 子应用 vendor 体积降 70% |
| 2 | **extract createSubApp 为样板化封装**：当前 9 个子应用 main.ts 各自声明；抽取 `defineYdzSubApp({ setup })` 单一入口，内置 initSharedRequest/guards/error-boundary | 1.5 人日 | 子应用 main.ts 压缩到 < 50 行 |
| 3 | **`@core` vs `effects` 路径收敛审计**：grep 梳理两套路径中的重复导出（utils/date、color、cn.ts），收敛为单一入口，对外 alias 不变 | 2 人日 | 解除双入口歧义 |
| 4 | **Turborepo inputs 精细化**：部分子应用 turbo 任务 inputs 过于宽泛缓存失效率高；按 task 特征收紧（dist 仅依赖 src + package.json，build dist + node_modules） | 1 人日 | turbo cache 命中率上升 |
| 5 | **Sentry tracesSampleRate 分级**：dev=1 / staging=0.3 / prod=0.05 | 0.5 人日 | APM 联动 |
| 6 | **monorepo `protocol:workspace` 按需引用**：peer 依赖（radix-vue / vee-validate / vxe-table）仅在 2-3 个子应用使用，可从 catalog 中按需引用 | 审计 0.5 人日 | vendor 体积续降 |

---

### 2.4 数据库表 / 前后端数据一致性（P1）

#### 现状

- 后段 10 业务模块统一使用 MyBatis-Plus + ydzs-common-jdbc（自定义拦截器 + 逻辑删除 + 数据权限）。
- 数据权限虽在 JDIZ-JDBC-002 规则中要求，但启动状态未纳入 CI 校验。
- 多租户 `tenant_id` 隔离、软删除填充、字段级加密注解（`@SensitiveField`）分布不均。

#### 对标差距

- 美团/字节中台：数据权限开关必须走配置中心 + 启动自检 fail-fast。
- 阿里云 polarDB 低代码：租户隔离有 lint 插件禁止裸 SQL。

#### 可落地动作

| 序号 | 动作 | 工作量 | 预期收益 |
|------|------|--------|----------|
| 1 | **数据权限启动自检**：后端新增 `DataSourceHealthIndicator`，启动时校验 ydzz-jdbc 拦截器是否已注册；未启用即 `APPLICATION_FAILED` | 1 人日 | 永远不会有"忘记开权限"事故 |
| 2 | **多租户 ID 强制 + CI 卡点**：sql-firewall 覆盖 9/10 模块；CI 接入扫描规则禁止任何 mapper XML 省略 tenant_id | 0.5 人日 | 零泄漏 |
| 3 | **字段标准化同步（字典）**：前端 `useDictEvent` 已实现广播；但 dict 表结构变更后端无 listener 推送致前端 stale。建议后端 dict 变更走 Redis event / SSE 推送 | 2 人日后端 + 0.5 前端 | 字典不需要 F5 |
| 4 | **Flyway/Liquibase 数据库版本管理**：当前 schema 手工 DDL + 改 yml；引入 `flyway-maven-plugin`，与 `common-docs` 文档同版本管理 | 3 人日 | 表变更可回滚可审计 |

---

### 2.5 功能增强（P1 — 平台级四件套）

#### 现状

- dashboard 已有 analytics 分析、workspace 工作区。
- 各子应用覆盖 9 大业务域。
- 但缺失：**操作审计前端详情页**（仅后端有 audit 模块）、**统一搜索入口**（仅在 main 有 UI）、**实时通知中心**（useWebsocket 仅部分子应用接入）、**全局 Excel 导入导出**（仅 cronjob 和 userinfo 有）。

#### 对标差距

- 飞书管理后台 / 阿里 DataWorks：审计 / 搜索 / 通知 / 导入导出视为"平台级四件套"，在 admin shell 内统一提供，子应用零开发接入。

#### 可落地动作

| 序号 | 动作 | 工作量 | 预期收益 |
|------|------|--------|----------|
| 1 | **平台级审计明细页**：main 下新增 `views/audit/`，对接 `/api/v1/audit`；含操作人/时间/前后值 diff，由 `YdApprovalTimeline` 组件升级 | 3 人日 | 四件套补全 1/4 |
| 2 | **统一搜索入口升级**：global-search 组件对接后端 `nextwiki-search` + `agent-search` fulltext API | 2 人日 | 四件套补全 2/4 |
| 3 | **实时通知中心**：main 壳 SSE 接收器 + toast 队列 + 未读 badge + 已读/清空；子应用通过 micro-kernel 跨 iframe 传递 | 3 人日 | 四件套补全 3/4 |
| 4 | **全局 Excel 导入导出**：基于 `use-excel-export.ts` + `use-excel-import.ts` 封装成 `defineCrudImportExport(config)` 组合式，list 页一行接入 | 2 人日 | 四件套补全 4/4 |
| 5 | **辅助功能 — AppTour 升级 main 壳**：统一引导；新增 YdAppTour 与 YdKeyboardHelp 组合 | 1 人日 | 新手体验 |
| 6 | **可观测曲线页（Grafana 简版）**：后端已有 performance-tracker 前端数据；在 main 新增 dashboard：P95、错误率、并发子应用数 | 2 人日 | RUM 闭环 |

---

### 2.6 性能提升（P2 — 量化指标驱动）

#### 现状

- 构建：turbo 已、vite 6 optimizeDeps 预设、lazy-import；体积预算通过 check:size 卡点。
- 运行时：preload-strategy + route-predictor + skeleton + page-cache + scroll 记忆。
- vendor 仅 main 壳 importmap 外置，子应用各自打 pinia/vue。
- 无 RUM 基线监控（web-vitals 已采集但无阈值卡点）。

#### 对标差距

- 字节飞书管理后台首屏 FCP ≤ 1.2s（4G slow）；LCP ≤ 2.0s。
- 美团商家后台弱网 FCP 要求 ≤ 3.2s（4G slow）。
- 阿里云 DataWorks CLS ≤ 0.05。

#### 可落地动作

| 序号 | 动作 | 工作量 | 预期收益 |
|------|------|--------|----------|
| 1 | **vendor 外置子应用化**（同 2.3 节第 1 项） | — | 首屏 vendor 从 450KB gzip → 80KB |
| 2 | **Turborepo remoteCache 接入**：CI 无 TURBO_REMOTE_CACHE；接入 Vercel Artifacts 或自托管 | 1 人日 | CI build time -40% |
| 3 | **Vitest coverage threshold 门禁**：`vitest.config.ts` 加 `coverage.thresholds` 阈值 + lcov | 0.5 人日 | CI 可见 badge |
| 4 | **CLS Budget CI 卡点**：web-vitals 已采集但没阈值；落地：CLS > 0.1 率 ≥ 5% 即 CI 失败；加 skeleton 遮罩 | 1 人日 | 视觉稳定性量纲补齐 |
| 5 | **图片/头像缩放参数化**：加 `?w=120` 让后端 `common-docs` 动态缩略 | 0.5 人日 | LCP - |
| 6 | **路由级 bundle 分析仪表板**：`rollup-plugin-visualizer` 已接入 build:analyze；沉淀为 CI 周产出 | 0.5 人日 | 体积趋势可观察 |
| 7 | **pinia store 懒注册**：9 个子应用在 main.ts 顶部挂 pinia + 全部 store；可改为 router 进入才注册 | 2 人日 | 启动 js 执行续降 |

---

### 2.7 体验改善（P2 — 微交互 + 辅助功能 + 国际化细节）

#### 现状

- 锁屏 / 偏好设置 / 主题 / 字号 / 语言切换已覆盖。
- 弱网提示（YdNetworkStatus）+ 错误边界（YdErrorBoundary）全局生效。
- 键盘快捷键（use-keyboard-shortcut）+ AppTour 引导已有。
- i18n 三中英 default + 子级 keys 已打通。
- 但子应用切换动效、命令面板、danger 二次确认、搜索延迟、筛选联动等细节存在优化空间。

#### 对标差距

- 飞书：子应用切换无感知（预加载 + 淡入）。
- Notion/Linear：键盘优先设计，`/` 命令面板全局可用。
- 阿里：danger 操作双重 confirm + 影响范围预览。

#### 可落地动作

| 序号 | 动作 | 工作量 | 预期收益 |
|------|------|--------|----------|
| 1 | **子应用切换丝滑过渡**：micro-kernel 已有 page-cache + skeleton，但降级态是硬切；加 CSS `view-transition` 或 transition 淡入 | 1 人日 | 体感从"卡一下"到"丝滑" |
| 2 | **`/` 命令面板**：仿 Linear / VS Code，main 壳级 `Cmd+K` 全局路由跳转 + 搜用户/文档/设置 | 3 人日 | 键盘用户效率质变 |
| 3 | **danger 操作防护升级**：当前仅后端校验；前端 danger button（删除/改 quota/清库）加 confirm modal + 影响范围预览 | 2 人日 | 误操作事故续降 |
| 4 | **键盘帮助面板**：YdKeyboardHelp 升级为全局 help sheet，分"通用/列表/表单"三张 tab，可搜索 | 1 人日 | 用户自助率上升 |
| 5 | **Loading 描述文案**：关键 route 加文案（"正在加载 34,000 条用户…"） | 0.5 人日 | 用户等待焦虑下降 |
| 6 | **i18n fallback 策略**：key 缺失时 fallback 到英文 + dev 模式 console warn + 上报到 error-monitor | 1 人日 | 国际化"死key"归零 |
| 7 | **字体 subsetting + preload**：中文 woff2 仅加载 3500 常用汉字 + preload | 1 人日 | FCP - 300ms |
| 8 | **偏好设置云同步**：secure-ls 本地加密 → 加 `preferences.syncConfig='cloud'` 走 backend preference 表 | 2 人日 | 跨设备偏好漫游 |

---

## 三、优先级与路线图

### 第一阶段（1-2 周）：P0 卡点清零 + 测试补起来

| 项 | 动作 | Owner |
|----|------|-------|
| P0-T1 | comm/request 拦截器单测 | 前端 |
| P0-T2 | comm 基础 util 函数单测 | 前端 |
| P0-T3 | 清理 `.generated-archived/` 残留 | 前端 |
| P0-T4 | 数据权限启动自检（后端） | 后端 |

### 第二阶段（2-4 周）：P1 贯通 + 架构减负

| 项 | 动作 |
|----|------|
| P1-T1 | 错误码全链路联动 + centralized error catalogue |
| P1-T2 | vendor 外置扩展到子应用 |
| P1-T3 | `defineYdzSubApp` 样板封装 |
| P1-T4 | 数据字典 SSE 实时推送 |
| P1-T5 | 平台级审计页 / 搜索 / 通知 / Excel 导入导出（四件套） |

### 第三阶段（1-2 月）：P2 体验升级 + 性能基线

| 项 | 动作 |
|----|------|
| P2-T1 | Web Vitals 基线建立（LCP/CLS/FID）+ CI 卡点 |
| P2-T2 | 子应用切换丝滑过渡 |
| P2-T3 | `/` 命令面板 |
| P2-T4 | Danger 操作防护升级 |
| P2-T5 | Turborepo remoteCache 接入 |
| P2-T6 | 字段标准化 + schema 版本管理 |

---

## 四、度量指标演进

| 维度 | 当前 | 第一阶段末 | 第二阶段末 | 第三阶段末 |
|------|------|-----------|-----------|-----------|
| 前端 UT 覆盖率 | ≈ 0% | ≥ 35% | ≥ 50% | ≥ 60% |
| 后端 UT 覆盖率 | 0% | — | ≥ 15% | ≥ 40% |
| 契约漂移漏检率 | 0（已闭环） | 0 | 0 | 0 |
| 首屏 FCP（4G slow） | 未拉 baseline | ≤ 3.5s | ≤ 2.0s | ≤ 1.2s |
| CLS | 未卡 | ≤ 0.1 | ≤ 0.05 | ≤ 0.02 |
| Bundle 总体 gzip | 待重新测 | -30% | -50% | -55% |
| 无障碍 WCAG 违规（critical/serious） | 0（CI 已卡） | 0 | 0 | 0 |
| SonarQube 技术债 | 未接 | 接入 | ≥ B | ≥ A |

---

## 五、与竞品能力矩阵对比

| 能力 | 当前 YDSZ | 飞书管理台 | 阿里 DataWorks |
|------|----------|-----------|--------------|
| 微前端预测预热 | 自研 route-predictor | icestark + 命中 | icestark |
| 多沙箱（iframe + proxy） | 双引擎 | 仅 proxy | iframe |
| 单向 API 漂移检测 | CI lock + 三源降级 | 手工比对 | Pact |
| 双向 MSW 仿真 | 待升级 | msw + storybook | 实时仿真 |
| 错误码中心联动 | 自制副本 | 平台统一定义 | 中心化 |
| 无障碍 CI | axe-playwright | axe + browsers | 合规报告 |
| 视觉回归门禁 | 播放组件基线 | 商业组件库 | AVO |
| 审计操作详情 | 仅后端 | 前端 UI | 日志 tab |
| 实时通知中心 | 待升级 | unified | 公告栏 |
| 全局命令面板 Cmd+K | 缺失 | 内置 | Palette |
| 数据权限启动自检 | 待做 | fail-fast | 启动闪断 |

> **结论**：YDSZ 在**微前端内核 / 监控体系 / CI 门禁 / 预测预热**四个维度达到或超越头部竞品；**错误码中心 / 全局命令面板 / 数据权限自检 / 数据字典实时通知**四块短板需在第二阶段补全。

---

## 六、风险与依赖

| 风险 | 缓解 |
|------|------|
| vendor 外置改动量大，可能引发运行时单例等问题 | 保留 `shared-deps` 校验 + 灰度开关 |
| 错误码中心联动需后端改 ydzs-cloud 异常链路 | 分阶段：先前端兜底 map，后续推后端 centralized error code |
| 全局搜索入口需后端统一 search 服务 | 本期只做代理转发；后续独立建设 search 微服务 |
| 测试文化未建立 → 覆盖率数字虚高 | 要求每个测试 3 处以上断言；CI 驳回仅渲染无断言测试 |

---

*Written by 妙手 (CatPaw) — 2026-10-04*
