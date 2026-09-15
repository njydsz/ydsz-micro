# YDSZ 全栈对标分析报告

> 分析对象：ydsz-cloud（JDK 21 + Spring Boot 4.1.0 微服务后端）+ ydsz-micro（pnpm+turbo monorepo 微前端）
> 对标基准：RuoYi / pig / JeecgBoot / maku-boot / SpringBlade + 阿里《Java 开发手册》、Google SRE、字节/阿里前端工程规范、微前端业界实践（qiankun/wujie/garfish）
> 方法：全量代码实读核验（非纸面推断），关键结论均附文件路径证据；分析日期 2026-09-14
> 优先级口径：P0 = 能力断裂/规范矛盾，必须先做；P1 = 架构与能力补齐，本季度；P2 = 增强项，长期规划

---

## 修复进展（2026-09-14 更新）

P0 三项已实施落地：

| # | 问题 | 状态 | 落地内容 |
| --- | ---- | ---- | -------- |
| P0-1 | 前端监控上报闭环断裂 | 代码完成，待联调 | ydsz-system 新增 `MonitorReportController`（`/monitor/error`、`/monitor/web-vitals`、`/v1/monitor/sourcemaps`）+ `MonitorReportService`（指标经 common-sentry 上报，遵守 §28 禁自建 MeterRegistry；标签白名单归一化防 Prometheus 标签爆炸；不落库以遵守 §35）+ 5 个 DTO + `ByteArrayMultipartFile`；`ydsz-system-server` 补 `ydsz-common-file` 显式依赖；新增错误码 `MONITOR_SOURCE_STORE_FAILED`(B97001)；网关 `AuthGlobalFilter` 白名单放行 8 条上报路径；`routes-nacos.yaml` 新增 `ydsz-system-monitor` 路由 |
| P0-2 | CI e2e-smoke 跑空脚本 | 完成 | 依据 §16.10（禁止 E2E / 禁止 `test:e2e` 脚本 / 禁止 e2e 目录）**删除**违规的 `e2e-smoke` job；其中与测试无关的构建与体积门禁提取为 `bundle` job，并从"仅手动触发"升级为 PR 必跑 |
| P0-3 | 性能预算双轨矛盾 | 完成 | 新建 `conf/budget.config.json` 单一事实源（gzip 口径）；`bundle-budget.ts` 与 `bash/check-size.mjs` 共同消费该配置；同时修复 `check-size.mjs` "产物目录不存在即静默通过"的隐患（CI 下无产物视为门禁失效） |

**遗留事项**：Nacos 上的 `gateway-routes.json` 需同步新增 monitor 路由（仓库内仅为模板）；需在联调环境验证网关 `PayloadValidationFilter` / `RateLimit` 不阻断上报；`§15.10 → §16.10` 的文档引用编号漂移（ADR-001/005 等）待统一。

---

## 一、总体判断

**亮点（达到或超过大厂水准）**：

| 领域 | 现状 | 对标结论 |
|------|------|----------|
| 工程骨架 | 后端 36 个 common 模块按 L1–L6 六层分级聚合；前端 pnpm+turbo+9 子应用同构脚手架 | 超过 RuoYi/pig 的单体式脚手架，接近阿里中台工程结构 |
| 分层架构 | 业务服务 DDD/COLA 六模块（api/app/domain/infra/server/web），含防腐层与事件模型 | 优于 JeecgBoot/maku-boot 的经典三层 |
| 网关 | 13 个全局过滤器（trace/IP/SQL注入/限流/熔断/灰度/审计/版本治理），顺序常量集中管理 | 过滤器完备度超过多数开源竞品 |
| 安全 | OAuth2 + OIDC/JWKS + RBAC + **行列级数据权限**（脱敏拦截器）+ 接口注解鉴权 + BCrypt | 达大厂水平，行/列级权限为竞品中少有 |
| 消息一致性 | RocketMQ 事务消息 + DLQ + **Outbox 本地消息表**（message/cronjob 双服务落地） | 超过竞品普遍的"裸 MQ"用法 |
| 契约治理 | 前后端 OpenAPI 契约静态提取 + CI 漂移门禁（gen-contract.py --check）+ SDK 自动生成 | 竞品基本没有等效机制，属差异化优势 |
| 微前端内核 | 自研 ESM 内核约 65 文件/1.5 万行：三沙箱、四策略预加载、马尔可夫路由预测、资源调度 LRU/TTL | 能力面超过 qiankun，但见"过度设计警示" |
| 容器化 | 前后端 Dockerfile 均为多阶段构建 + 健康检查；nginx Brotli 预压缩 + CSP strict-dynamic + HSTS | 达大厂发布规范 |

**短板（与大厂规范的核心差距，按严重度排序）**：

1. **前端监控上报闭环断裂（P0）**：`comm/effects/monitor` 三层采集（错误/Web Vitals/预加载指标）上报至 `/api/monitor/error|web-vitals|preload-metrics`（`monitor-endpoints.ts`），sourcemap 上传至 `/api/v1/monitor/sourcemaps`（`bash/upload-sourcemaps.mjs`）——但 **ydsz-cloud 全仓不存在任何接收这些端点的 Controller**（Grep `monitor/(error|web-vitals|preload-metrics|sourcemaps)` 0 命中，仅有 FlowMonitorDashboard 等业务监控）。ADR-06 明示"端点需网关提供，未部署前仅进控制台"。整个可观测体系是"采集端齐备、接收端缺席"的半成品。
2. **CI 配置与事实矛盾（P0）**：`.github/workflows/ci.yml` 的 `e2e-smoke` job 执行 `pnpm test:e2e`，但根 `package.json` 无任何 test 脚本、`e2e/` 目录为空——该 job 手动触发**必然红**。
3. **性能预算双轨制互相矛盾（P0）**：构建期 `bundle-budget.ts` 默认单 chunk **5MB**/总量 **15MB**（注释自述"vendor 通常 2-4MB"），CI 门禁 `check-size.mjs` 却是 main **512KB**/子应用 **384KB**——两道门禁口径相差 10 倍以上，前者形同虚设，后者一旦 vendor 超标会与前者给出相反结论。
4. **测试近乎为零**：后端全仓仅 1 个测试文件（`CommonLayerArchitectureTest.java`，ArchUnit 守护 common 层）；前端按云顶规范 §15.10 全量移除测试，且 Storybook 仅 9 个原子组件 stories。对标大厂"单测覆盖率门禁 + Testcontainers 集成测试"，这是**质量不可度量**的最大风险源（1.5 万行微前端内核与 30+ Controller 服务群均无回归手段）。
5. **a11y 实际覆盖为零（P1）**：ADR-005 声明了可访问性基线，但源码中 `aria-/role=` 几乎全部只存在于 dist 产物，axe 已移除，仅剩 ESLint 静态规则——基线声明与代码事实脱节。
6. **agent-web 对话无 Markdown/代码高亮渲染（P1）**：`apps/agent-web/src` 中 Grep `marked|markdown-it|highlight|shiki` 0 命中，AI 对话以纯文本 content 流式输出——AI 是 README 宣称的核心差异化能力，渲染体验却是硬伤。
7. **前后端灰度口径割裂（P1）**：前端 `canary-manager-core.ts` 按 FNV-1a(userId) < percentage + 白名单分流**前端子应用版本**；后端 `GrayLoadBalancer` 基于 LoadBalancer 服务实例元数据分流**后端实例**。两套机制独立配置、独立生效，同一用户可能拿到 canary 前端 + stable 后端，无统一控制面。
8. **信创缺位（P2）**：国密仅 `Sm3Utils.java` 工具级（摘要），无 SM2/SM4 业务链路，无达梦/人大金仓方言——这是 maku-boot 等竞品的标配卖点。

---

## 二、五维度分析与落地建议

### 维度 1：能力贯通（端到端链路完整性）

| # | 现状（证据） | 对标差距 | 建议 | 优先级 |
|---|-------------|----------|------|--------|
| 1.1 | 监控上报端点后端缺失（见短板 1） | 大厂规范：可观测必须闭环到看板+告警（Google SRE 四大黄金信号） | 在 ydsz-system（或独立 ydsz-monitor 聚合服务）新增 `MonitorReportController`：`POST /monitor/error|web-vitals|preload-metrics` + sourcemap 接收存储（MinIO），错误按 traceId 聚合落 PostgreSQL，Prometheus 指标暴露对接既有 Grafana；网关路由 `routes-nacos.yaml` 补对应前缀。验收：前端 `setupMonitor` 默认配置上报 200，Grafana 出现前端错误率/Web Vitals 面板 | **P0** |
| 1.2 | sourcemap 上传后即删（`upload-sourcemaps.mjs`），但接收端不存在 | Sentry/SkyWalking 前端源码映射是标配 | 同 1.1 一并落地；上传走 MinIO，按 release 版本目录归档，保留策略 90 天 | **P0** |
| 1.3 | 前后端灰度双轨（见短板 7） | 大厂：灰度规则统一控制面，前后端版本联动 | 短期：网关新增只读端点 `GET /api/v1/gray/config`，前端 canary 配置改为启动时拉取，Nacos 单一数据源；长期：灰度规则 schema 化（服务名+版本+百分比+白名单），前端 registry 与后端实例元数据同源生成 | **P1** |
| 1.4 | 契约门禁已闭环（静态提取+CI 漂移检查）——本项是优势 | — | 保持；建议将 `gen:api`（运行时 /v3/api-docs）与静态基线做 CI 双向 diff，防"文档与实现"两侧漂移 | P2 |
| 1.5 | 微前端通信：globalState(207 行)引用 16 处、message-broker(282 行)引用 28 处，多为框架内部使用 | 微前端价值在于跨应用复用业务能力 | 抽查业务侧真实调用点；推动典型场景（如 userinfo 的用户选择器、message 的通知角标）跨应用共享，验证通信层 ROI | P2 |
| 1.6 | Chrome DevTools 扩展已建（chrome/） | — | 调试扩展与内核版本联动发布；补充"灰度命中/预加载命中率"面板（依赖 1.1 先闭环） | P2 |

### 维度 2：架构优化

| # | 现状（证据） | 对标差距 | 建议 | 优先级 |
|---|-------------|----------|------|--------|
| 2.1 | Sentinel 1.8.8（已停止维护）与 Resilience4j 双熔断并存（`SentinelGatewayConfig.java` + `CircuitBreakerGlobalFilter.java`） | 大厂规范：单一熔断方案，避免语义分裂 | 归一到 Resilience4j（Spring 官方生态、持续维护）：梳理 Sentinel 规则数据源（Nacos）迁移映射，网关限流用 R4j RateLimiter 或 Spring Cloud Gateway 内置 RequestRateLimiter（Redis 令牌桶）；发布 ADR 记录决策 | **P1** |
| 2.2 | Seata 仅集成未使用：`ydsz-common-seata` 完整封装，但业务代码 `@GlobalTransactional` 0 命中，跨服务一致靠 Outbox | "集而不用"是架构债：升级负担+认知成本 | 二选一并出 ADR：a) 移除 ydsz-common-seata（推荐，Outbox 已覆盖现有场景）；b) 明确未来强一致场景清单后再保留。对标：多数竞品同样无 Seata，Outbox 是更现代的选择 | **P1** |
| 2.3 | 业务服务无架构守护：ArchUnit 仅覆盖 common 层（`CommonLayerArchitectureTest.java`） | 阿里规约：分层依赖 CI 阻断全仓生效 | 将 ArchUnit 测试模板化注入 9 个业务服务（六层依赖方向 + Controller 不直接引用 infra + 命名约定），挂入 ci.yml verify job。这是"规范允许的测试形态"（后端已有先例），落地阻力最小 | **P1** |
| 2.4 | 数据库 schema 为单文件 `deploy/sql/V26.09.01.sql`（pom L1062 明确禁 Flyway/Liquibase） | 大厂：schema 变更可追溯、可回滚、可审计 | 不必破例引入 Flyway：将单文件拆为 `deploy/sql/changelog/V26.09.01__xxx.sql` 版本目录 + 自研执行器（记录已应用版本表），保留"禁框架"规范同时获得可追溯性；生成器（generator 服务）可产出 changelog 骨架 | **P1** |
| 2.5 | 无 K8s/Helm IaC（Glob 0 命中），部署编排游离于仓库外 | 大厂：部署即代码、环境一致 | 补 `deploy/k8s/`（namespace/deployment/service/ingress + HPA）与 Helm chart；网关 Nacos 路由、灰度标签均以 values 注入，与 1.3 灰度控制面衔接 | **P1** |
| 2.6 | 业务层循环依赖/超大类无量化：TODO 84 处分散于 workflow(最多)/agent/cronjob；前端 WorkflowDesigner/WopiEditor/DecisionTableDesigner 疑似 >800 行 | 大厂：SonarQube 认知复杂度门禁 | 前端已有 `vsh check-circular`，扩展输出"文件行数 TOP20 报告"进 CI artifact；后端在 2.3 ArchUnit 中加 `noClasses().should().haveFullyQualifiedName...` 类级守护起步，逐步引入类行数扫描脚本 | P2 |
| 2.7 | 网关 13 过滤器 + `GatewayFilterOrder` 常量管理 | — | 已达规范，补充：过滤器性能打点（每过滤器耗时直方图），防过滤器链膨胀劣化网关吞吐 | P2 |

### 维度 3：功能增强

| # | 现状（证据） | 对标差距 | 建议 | 优先级 |
|---|-------------|----------|------|--------|
| 3.1 | agent-web 对话纯文本流（无 markdown/高亮库，Grep 0 命中）；DAG 设计器/RAG/团队运行等视图已具备 | 对标 Dify/Coze/Cherry Studio：AI 对话渲染是产品门面 | 引入 `markdown-it`（或 `marked`）+ `shiki`（按需语言高亮）+ 流式渲染防抖（chunk 合并 30–50ms 批量渲染，防 AST 反复解析）；代码块复制按钮、思考过程折叠、token 速率显示。落点：`apps/agent-web/src/views/agent-chat/` 新增 `MessageRenderer.vue` | **P1** |
| 3.2 | 业务组件库偏薄：common-ui 仅 captcha/page-status/skeleton/authentication 等；表单仅 YDSZForm 单模式 schema 驱动 | JeecgBoot 核心竞争力即在线表单/报表/低代码 | 补高频业务组件：富文本（TipTap）、高级查询区（conditions 组合）、导入导出向导、人员/部门/角色选择器（对接 userinfo API）、审批意见输入。落点：`comm/effects/common-ui` + `shared-business`，配 Storybook 文档（存量 9 stories 全是原子组件） | **P1** |
| 3.3 | 信创仅 SM3（`Sm3Utils.java`） | maku-boot 等竞品标配：SM2/SM4 + 达梦/金仓 | 加密场景分级落 SM4（Redis/DB 连接串、sourcemap 存储等）；MyBatis 多方言已有 `sqls/legacy-dialects` 基础，补达梦/金仓 CI 编译验证矩阵即可低成本宣称"信创就绪" | P2 |
| 3.4 | RocketMQ 无延迟消息用法（事务+DLQ+Outbox 已有） | 竞品普遍有定时/延迟场景 | message 服务暴露延迟消息能力（RocketMQ 5.x 定时消息），供 cronjob 告警重试、workflow SLA 超时、订单类未来场景复用 | P2 |
| 3.5 | 代码生成器 generator-web 仅 17 个 vue（最简陋子应用），但后端 generator 服务 + 前端 `gen:app` 脚手架已通 | RuoYi/JeecgBoot 以代码生成为获客利器 | 打通"生成即预览"：模板渲染结果 diff 视图 + 一键下载 zip；与 3.2 组件库联动生成 CRUD 页面骨架（复用 use-crud-table + YDSZForm） | P2 |

### 维度 4：性能提升

| # | 现状（证据） | 对标差距 | 建议 | 优先级 |
|---|-------------|----------|------|--------|
| 4.1 | 预算双轨矛盾（见短板 3） | 大厂：单一预算配置源（budget.json），构建/CI/报告同口径 | 以 `conf/budget.config.json` 为唯一源：构建期插件与 `check-size.mjs` 均读它；分层预算（entry≤384KB gzip / vendor 单独核算 / CSS 128KB）；输出到 CI artifact 供体积趋势看板 | **P0** |
| 4.2 | 预加载四策略 + 马尔可夫预测 + speculation-rules 已实现，且 preload-metrics 指标回环已埋点——但上报闭环断裂（1.1），**命中率数据无处可去，策略无法数据驱动调优** | — | 1.1 落地后，用真实命中率数据决策：`preload-metrics` 面板观察 hover/idle/route/frequency 四策略命中分布，低收益策略降级为默认关闭（见"过度设计"节） | **P1** |
| 4.3 | 虚拟列表组件已备（`VirtualList/VirtualSelect`，@tanstack/vue-virtual），使用面未统计 | — | 审计大列表页面（消息中心、任务日志、wiki 文件树）统一接入；vxe-table 大数据开启 `scroll-y` 虚拟滚动 | P2 |
| 4.4 | 缓存策略：HTTP 静态资源 1y immutable + chunk hash 已达标；SW 缓存仅 Roadmap 提及（HMAC 验签一并评估） | 大厂：SW 离线 + 版本原子切换 | 评估 Service Worker 仅缓存 importmap vendor 与公共 chunk（子应用业务代码仍走 HTTP 缓存），配合 manifest sha256 做版本原子性校验——这是 Roadmap 已有项，给出实施边界即可启动 | P2 |
| 4.5 | 后端：Redis 缓存 + 权限失效事件监听（`PermissionCacheInvalidationListener`）已备；无缓存穿透/雪崩防护证据 | 大厂：空值缓存+随机 TTL+布隆过滤器三件套 | 高频查询接口（菜单/权限/字典）补穿透防护：空值短 TTL + TTL 加随机抖动；热 key 接入 Redisson 已有的多级能力 | P2 |
| 4.6 | 无分库分表（ShardingSphere 仅 ADR 提及 + HintManager 未使用） | 竞品 pig/SpringBlade 也基本没有，非紧迫 | 不建议现在引入（见过度设计）；先做数据归档策略（log/trace 类表按月分区），单表千万行前再评估 | P2 |

### 维度 5：体验改善

| # | 现状（证据） | 对标差距 | 建议 | 优先级 |
|---|-------------|----------|------|--------|
| 5.1 | a11y 声明与事实脱节（见短板 5） | 阿里/字节前端规范：交互组件 aria 基线 | 三步走：a) 接入 `eslint-plugin-vuejs-a11y` 进 verify job（纯静态，符合规范约束）；b) ui-kit 与 common-ui 交互组件补 aria-label/role/keyboard 导航（组件库一次性投入，全局收益）；c) CI 加 Lighthouse a11y 只读报告（不阻断，先量化） | **P1** |
| 5.2 | 错误提示一致性：后端错误码体系完备（`ExceptionCodeScanner` + `A00000` + i18n），但前端错误呈现层未见统一映射表 | 大厂：错误码→用户文案→操作建议三层映射 | 前端建 `error-code-map.ts`（由后端 `ExceptionCodeDocEndpoint` 自动生成！后端已暴露错误码端点，前端 SDK 生成链再前进一步），未知码兜底"复制错误码+联系管理员" | **P1** |
| 5.3 | 暗黑模式（use-theme-sync + startViewTransition）、骨架屏、空态、网络状态组件齐备 | — | 已达标；补暗黑模式下 echarts 主题联动与截图回归（人工抽检清单化） | P2 |
| 5.4 | i18n：8 应用双语 + key 一致性 CI 校验已达标；**业务字段翻译**（README 宣称）覆盖度未度量 | — | `check:i18n` 扩展输出未翻译 key 数量报告（zh 有 en 无），纳入 CI artifact 观察趋势 | P2 |
| 5.5 | 移动端：`use-responsive` 存在但无系统适配策略 | 竞品普遍"PC only"，非差距 | 明确产品口径：若 PC-only，在 README/ADR 声明并加小屏友好提示页；若需移动审批（workflow 待办），单独做精简移动壳（复用 micro-kernel 独立入口） | P2 |
| 5.6 | console.log 残留（monitor breadcrumb、notification、WopiEditor 等）+ `: any` 普遍（已有 `fix-form-any.mjs`/`codemod-console.mjs` 治理脚本） | 大厂：no-console 规则 + 存量递减门禁 | no-console 设 warn 并统计基线数，CI 输出"较上次变化量"，允许递减不允许新增（类似 Sonar leak 方法论）；`@ts-ignore` 仅 11 处，保持零增长 | P2 |

---

## 三、过度设计警示（架构负资产清单）

对标"以国内大厂开源实践为基准"的务实原则，以下能力**实现投入与当前收益不匹配**，建议以数据决策去留而非默认全开：

| 项 | 现状 | 风险 | 建议 |
|----|------|------|------|
| 马尔可夫路由预测 | route-predictor + core 合计 559 行 + minSampleSize 冷启动门槛 | 同源 9 子应用、路径前缀固定，转移矩阵信息量有限；维护成本 > 边际收益 | 1.1 闭环后看命中率数据：若预测命中不显著优于 route 策略，降级为实验特性（experimental flag） |
| speculation-rules 预热 | 187 行，浏览器支持参差（Safari 缺失） | 双份预加载心智（link-hints 已有） | 同上，数据说话；保持 progressive enhancement 定位即可 |
| iframe 沙箱 | ADR-007 自标 experimental（275 行） | 同源 ESM 场景几乎无隔离需求 | 维护性冻结：文档标注"仅异构接入场景"，不投入新特性 |
| Seata 集成 | 集而不用（2.2） | 升级负担 | 移除或明确场景 |
| Sentinel+R4j 双熔断 | 双方案并存（2.1） | 规则语义分裂 | 归一（2.1） |
| 36 个 common 模块 | 出现"集成未使用"（Seata/ShardingSphere hint） | 粒度偏细，编译图庞大 | 季度 unused-dependency 审计（对标前端 `vsh check-dep` 思路，后端补 ArchUnit noClasses 规则 + pom 依赖矩阵） |

> 原则：**每项高级能力都应有对应指标证明其激活率与收益**（预加载命中率、沙箱使用分布、灰度规则数），否则按"特性开关默认关"处理。这正是 1.1 监控闭环的价值——它是所有"数据驱动去留"决策的前置条件。

---

## 四、优先级路线图汇总

| 优先级 | 条目 | 落点 | 验收标准 |
|--------|------|------|----------|
| **P0** | 监控接收端点 + sourcemap 存储（1.1/1.2） | ydsz-cloud: system 或新 monitor 服务；网关路由 | 前端默认配置上报 200；Grafana 出前端错误率 + Web Vitals 面板 |
| **P0** | CI e2e-smoke 矛盾修复（短板 2） | ydsz-micro: ci.yml 或 package.json | 删除 job 或补齐脚本，CI 全绿 |
| **P0** | 性能预算单一配置源（4.1） | ydsz-micro: conf/budget.config.json | 构建期与 CI 同口径，报告进 artifact |
| **P1** | 熔断归一 + Seata 决策（2.1/2.2） | ydsz-cloud: gateway + ADR | 单方案 + ADR 归档 |
| **P1** | 业务层 ArchUnit 守护（2.3） | ydsz-cloud: 9 服务 test 目录 | verify job 阻断分层违规 |
| **P1** | schema changelog 目录化（2.4） | ydsz-cloud: deploy/sql | 版本表 + 可追溯执行记录 |
| **P1** | K8s/Helm IaC（2.5） | ydsz-cloud: deploy/k8s | 一条命令起全套环境 |
| **P1** | 灰度统一控制面（1.3） | 前后端 + Nacos | 同一 userId 前后端版本联动可验证 |
| **P1** | agent 对话 Markdown 渲染（3.1） | ydsz-micro: agent-web | 流式代码高亮 + 复制按钮可用 |
| **P1** | 业务组件库扩充（3.2） | ydsz-micro: common-ui/shared-business | 富文本/选择器/导入导出 + Storybook 文档 |
| **P1** | a11y 静态门禁 + 组件基线（5.1） | ydsz-micro: lint 配置 + ui-kit | eslint-plugin-vuejs-a11y 零 error |
| **P1** | 错误码→用户文案映射（5.2） | ydsz-micro: 生成链 | 未知错误码兜底路径统一 |
| **P2** | 信创（3.3）、延迟消息（3.4）、生成器增强（3.5）、虚拟列表推广（4.3）、SW（4.4）、缓存穿透防护（4.5）、i18n 度量（5.4）、console/any 递减门禁（5.6）等 | 见上文各条 | 见上文 |

**节奏建议**：P0 三项均为 1–3 天量级的"接线"工作，先做（监控闭环又是后续多项数据决策的前置）；P1 按"后端架构治理（2.1–2.5）→ 前端体验（3.1/5.1/5.2）→ 贯通（1.3）"三批推进；P2 按季度滚动。

---

## 五、与竞品的定位结论

- **vs RuoYi/pig**：YDSZ 在架构（DDD 六层 vs 三层）、安全（行列级数据权限）、一致性（Outbox）、契约治理（CI 漂移门禁）全面领先；在**生态与开箱即用**（代码生成成熟度、低代码表单、信创适配、社区文档）落后——这正是竞品的获客面，对应 3.2/3.3/3.5。
- **vs JeecgBoot**：低代码能力（在线表单/报表）是最大产品差距；但 YDSZ 的 agent-web（AI 原生）+ 微前端独立部署是对方没有的差异化，应优先把 3.1（对话渲染）做到 Dify 级体验，把差异化立住。
- **vs 大厂规范**：工程门禁体系（lint/type/契约/架构守护五类静态检查）已达大厂水准且自洽；唯一结构性缺口是**质量不可度量**（测试近零）——在云顶规范 §15.10 约束下，建议以"架构测试（ArchUnit 已有先例）+ e2e-smoke（CI 已有雏形）+ 契约测试"三类规范允许的测试形态补底线，此决策需 Marvin 定夺。

---

*证据索引：后端 `ydsz-cloud/pom.xml`、`ydsz-common/pom.xml`、`ydsz-gateway/src/main/java/com/njydsz/gateway/{filter,loadbalancer}/`、`ydsz-common/ydsz-common-{auth,lock,event,seata,exception,core}/`、`deploy/sql/V26.09.01.sql`、`Dockerfile`；前端 `comm/effects/micro-kernel/src/`（65 文件）、`comm/effects/{monitor,shared-auth,request}/src/`、`conf/vite-config/src/plugins/bundle-budget.ts`、`bash/check-size.mjs`、`bash/upload-sourcemaps.mjs`、`.github/workflows/ci.yml`、`apps/agent-web/src/`、`docs/decisions/adr-00{3,5,6,7}-*.md`。关键矛盾点（监控端点缺失、test:e2e 空脚本、预算双轨、markdown 渲染缺失）均经主分析独立 Grep 复核确认。*
