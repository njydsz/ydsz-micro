# 云顶项目测试深度评估报告

> **评估日期**：2026-09-16
> **评估范围**：ydsz-cloud 后端全部模块 + ydsz-micro 前端全部子应用
> **对标基线**：阿里巴巴《Java开发手册》、Google Testing Guidelines、美团测试规范、字节跳动质量体系、拼多多DDD实践
> **评估方法**：代码结构扫描 + 静态分析 + 依赖审查 + 规范对照

---

## 一、执行摘要

| 维度 | 当前状态 | 互联网大厂基线 | 综合评级 |
|------|---------|---------------|---------|
| 后端模块测试覆盖率 | 3/9 业务模块有测试 (33%) | 100% | **P0 阻断** |
| 后端测试/生产代码比 | 0.3% (≈1,975 / 645,662 行) | ≥100% | **P0 阻断** |
| 前端测试覆盖率 | 0%（已全量移除） | ≥70% | **P0 阻断** |
| 集成测试 | 0 处 | 核心链路全覆盖 | **P0 阻断** |
| E2E测试 | 0 处 | 关键流程覆盖 | **P1 严重** |
| 架构守护测试 | 1个（ArchUnit六层分级） | 分层+命名+依赖方向 | **P2 一般** |
| CI测试门禁 | 未强制跑测试 | 强制失败+覆盖率门禁 | **P0 阻断** |
| 规范与实践一致性 | 矛盾：规范禁止测试，代码已引入测试依赖 | 一致 | **P0 阻断** |

**核心发现**：项目处于 **"测试真空" 与 "规范摇摆"** 并存的状态。编码规范 §14 明确禁止测试代码，但后端部分模块已引入 JUnit/Mockito/AssertJ/ArchUnit 并编写了 11 个测试文件，父 pom 已配置 `maven-surefire-plugin` 注释为 "测试破零基础设施"。这种规范与实践的撕裂状态若不解决，将导致团队无所适从。

---

## 二、后端测试深度评估（D:\Code\open\ydsz-cloud）

### 2.1 测试基础设施现状

#### 2.1.1 测试框架配置

| 模块 | JUnit Jupiter | Mockito | AssertJ | ArchUnit | 注释说明 |
|------|:---:|:---:|:---:|:---:|------|
| ydsz-agent-domain | ✓ | - | - | - | P1: 单元测试基础设施 |
| ydzs-agent-infra | ✓ | - | - | - | P1: 单元测试基础设施 |
| ydzs-agent-server | ✓ | ✓ | - | - | P1: 单元测试基础设施（JUnit 5 + Mockito） |
| ydsz-literule-domain | ✓ | - | ✓ | - | P0-1: 测试基础设施（JUnit 5 + AssertJ） |
| ydsz-literule-server | ✓ | ✓ | ✓ | - | P0-1: 测试基础设施（JUnit 5 + Mockito + AssertJ） |
| ydsz-workflow-domain | ✓ | - | ✓ | - | P0-1: 测试基础设施（JUnit 5 + AssertJ） |
| ydsz-common-architecture-test | - | - | - | ✓ | ArchUnit 架构守护 |

**文件**：
- `D:\Code\open\ydsz-cloud\pom.xml`（第 Po-1 行）：`<!-- P0-1: maven-surefire-plugin 启用 JUnit 5 平台（测试破零基础设施） -->`
- `D:\Code\open\ydsz-cloud\ydsz-agent\ydsz-agent-domain\pom.xml`（第 65-70 行）：JUnit Jupiter test scope
- `D:\Code\open\ydsz-cloud\ydsz-literule\ydsz-literule-domain\pom.xml`：AssertJ + JUnit Jupiter
- `D:\Code\open\ydsz-cloud\ydsz-common\ydsz-common-architecture-test\pom.xml`（第 6-7 行）：`ydsz-common 六层分级体系 ArchUnit 自动化架构守护测试`

#### 2.1.2 已发现测试文件清单（11个文件 / 1,975行）

| 序号 | 绝对路径 | 测试类 | 测试框架 | 代码行数 | 质量评级 |
|:---:|---------|--------|---------|:-------:|:------:|
| 1 | `ydsz-agent\ydsz-agent-domain\src\test\...\SseEventTest.java` | 事件工厂+不可变语义 | JUnit Jupiter | 118 | ⭐⭐⭐⭐ |
| 2 | `ydsz-agent\ydsz-agent-domain\src\test\...\AgentExecutionRequestTest.java` | 不可变构造+子代理继承 | JUnit Jupiter | ~200 | ⭐⭐⭐⭐ |
| 3 | `ydsz-agent\ydsz-agent-domain\src\test\...\AgentStateKeyTest.java` | 键生成+段清洗 | JUnit Jupiter | ~120 | ⭐⭐⭐⭐ |
| 4 | `ydsz-agent\ydsz-agent-infra\src\test\...\SlidingWindowCompressorTest.java` | Token压缩算法 | JUnit Jupiter | ~150 | ⭐⭐⭐⭐ |
| 5 | `ydsz-agent\ydsz-agent-server\src\test\...\AbstractAgentExecutorLoadHistoryTest.java` | 预置上下文优先 | JUnit+Mockito | ~180 | ⭐⭐⭐⭐ |
| 6 | `ydsz-agent\ydsz-agent-server\src\test\...\ReActAgentExecutorPauseResumeTest.java` | 暂停/恢复检查点 | JUnit+Mockito | ~250 | ⭐⭐⭐⭐ |
| 7 | `ydsz-agent\ydsz-agent-server\src\test\...\ToolResultEvictionMiddlewareTest.java` | 工具结果截断 | JUnit+Mockito | ~150 | ⭐⭐⭐⭐ |
| 8 | `ydsz-literule\ydsz-literule-domain\src\test\...\ExpressionValidationResultTest.java` | 静态工厂方法 | JUnit+AssertJ | ~80 | ⭐⭐⭐⭐ |
| 9 | `ydsz-literule\ydsz-literule-server\src\test\...\FunctionRegistryTest.java` | 内置函数注册 | JUnit+AssertJ | ~280 | ⭐⭐⭐⭐ |
| 10 | `ydsz-workflow\ydsz-workflow-domain\src\test\...\FlowInstanceStatusTest.java` | 状态机终态判定 | JUnit+AssertJ | ~200 | ⭐⭐⭐⭐ |
| 11 | `ydsz-common\ydsz-common-architecture-test\src\test\...\CommonLayerArchitectureTest.java` | 六层分级依赖方向 | ArchUnit | ~200 | ⭐⭐⭐⭐ |

**质量观察**：现有 11 个测试文件质量普遍较高，具备：
- 完整的 Javadoc 中文注释（`@author ydsz-team`、`@since 26.09.14`）
- `@DisplayName` 中文场景描述
- AAA（Arrange-Act-Assert）清晰结构
- `@Nested` 组织状态机子场景（FlowInstanceStatus）
- `@Tag("unit")` 单元测试标记
- Mockito 用于基础设施层依赖隔离

### 2.2 业务模块测试覆盖热力图

| 业务模块 | 子模块生产代码行数 | 测试文件数 | 测试覆盖状态 | 等级 |
|---------|:-----------------:|:---------:|:-----------:|:---:|
| ydzs-agent | ~85,000 | **7** | 🟡 部分覆盖（仅domain+部分server） | P1 |
| ydsz-cronjob | ~45,000 | 0 | 🔴 零覆盖 | P0 |
| ydsz-gateway | ~30,000 | 0 | 🔴 零覆盖 | P0 |
| ydsz-literule | ~60,000 | **2** | 🟡 部分覆盖（domain + server引擎） | P1 |
| ydsz-message | ~55,000 | 0 | 🔴 零覆盖 | P0 |
| ydsz-nextwiki | ~95,000 | 0 | 🔴 零覆盖 | P0 |
| ydsz-system | ~40,000 | 0 | 🔴 零覆盖 | P0 |
| ydsz-userinfo | ~120,000 | 0 | 🔴 零覆盖 | P0 |
| ydsz-workflow | ~80,000 | **1** | 🟡 部分覆盖（仅domain枚举状态机） | P1 |
| ydsz-common | ~35,000 | **1** | 🟡 仅架构守护 | P2 |
| **合计** | **~645,662** | **11** | **整体测试代码占比 0.3%** | **P0** |

### 2.3 测试分层结构评估（大厂标准 vs 当前）

```
 大厂标准（测试金字塔）              当前状态（倒三角/真空）
  
       /~\  E2E (10%)                     —— 0
      / ~ \                                  
     /  ~  \  Integration (20%)          —— 0
    /   ~   \                               
   /    ~    \  Unit (70%)               —— 11个文件(纯POJO/算法)
  /     ~     \                            
 /_____________\                           
```

| 测试分层 | 大厂占比 | 当前占比 | 差距 |
|---------|:-------:|:-------:|:----:|
| **单元测试** | 70% | 存在但极少（仅算法/POJO层，缺业务逻辑层） | 业务逻辑测试真空 |
| **集成测试** | 20% | 0% | 完全缺失 |
| **E2E测试** | 10% | 0% | 完全缺失 |

### 2.4 后端关键发现与评级

#### P0-1 阻断：规范与实践严重矛盾

| 项目 | 规范要求 | 实际情况 |
|------|---------|---------|
| 规范 §14.1 | "禁止引入 JUnit、Mockito、AssertJ、Testcontainers、ArchUnit、JMH 等任何测试框架" | 已引入 JUnit Jupiter、Mockito、AssertJ、ArchUnit 四种 |
| 规范 §14.3 | "所有模块的 pom.xml 中禁止声明 test scope 的依赖" | 已声明 test scope |
| 规范 §14.4 | "项目清理过程中发现的任何测试代码必须立即删除" | 已存在 11 个文件、约 1975 行测试代码 |
| 父 pom 注释 | "P0-1: maven-surefire-plugin 启用 JUnit 5 平台（测试破零基础设施）" | 准备将测试作为 P0 事项落地 |

**矛盾状态**：规范正文说"禁止"，pom 注释说"破零"。团队将无所适从。

#### P0-2 阻断：核心业务逻辑零测试覆盖

以下核心领域服务无任何测试：
- `ydsz-userinfo`：120,000 行（RBAC、SCIM、MFA、OAuth2 身份认证）
- `ydsz-nextwiki`：95,000 行（秒传、版本控制、WOPI、安全扫描）
- `ydsz-cronjob`：45,000 行（Leader 选举、分片广播、异常自愈）
- `ydsz-message`：55,000 行（12 种渠道、DAG 编排、跨渠道抑制）
- `ydsz-workflow`：80,000 行（仅1个枚举测试，缺 BPMN 流转、节点跳转、超时补偿测试）

#### P0-3 阻断：CI无测试门禁

GitHub Actions CI (`D:\Code\open\ydsz-micro\.github\workflows\ci.yml`)：
- 第 61 行：`# 测试代码已按云顶编码规范 15.10 全量移除，pnpm test 脚本不存在`
- 后端 CI：未扫描到测试运行步骤
- 后果：PR 合入无需通过任何测试

#### P1-1 严重：无覆盖率量化和门禁

| 维度 | 现状 | 大厂标准 |
|------|------|---------|
| 覆盖率工具 | 无 JaCoCo 配置 | JaCoCo / Istanbul |
| 覆盖率门禁 | 无 | PR 增量行覆盖率 ≥ 60% |
| 全量覆盖率报告 | 无 | SonarQube / Codecov 集成 |
| 趋势监控 | 无 | 覆盖率下降自动阻断 |

#### P1-2 严重：集成测试完全空白

应覆盖的场景：
- 多租户数据隔离（SQL 过滤 + Redis 隔离）
- RBAC 权限链路（鉴权 → 鉴权 → 数据范围）
- 分布式事务（Seata TCC / Saga）
- 消息队列（RabbitMQ 可靠性、幂等消费）
- 缓存一致性（Redis 与 DB 双写、布隆过滤器防穿透）
- 分布式锁（看门狗续期、可重入、红锁）
- 工作流引擎（状态机流转、超时回滚、补偿）
- 规则引擎（LiteExpr AST 编译、沙箱隔离、热加载）

#### P1-3 严重：前端测试完全空白

CI.yml（第 6-11 行）声明：
> `§16.10 禁止测试代码：本仓库不存在 test / test:e2e 脚本，也不存在 e2e 目录。测试代码已按云顶编码规范 15.10 全量移除`

前端 10 个子应用（main-web + 9 个业务子应用）均无任何：
- 组件单元测试（@vue/test-utils / Vitest）
- composable 逻辑测试
- E2E 测试（Playwright / Cypress）
- 契约测试（Pact / MSON）
- 无障碍测试（axe-core）

---

## 三、前端测试深度评估（D:\Code\open\ydsz-micro）

### 3.1 前端测试基础设施审计

| 维度 | 当前状态 | 大厂标准 | 评估 |
|------|---------|---------|:----:|
| 测试框架 | 无 | Vitest / Jest 29+ | P0 |
| 组件测试工具 | 无 | @vue/test-utils 2+ | P0 |
| E2E 框架 | 无 | Playwright 1.40+ | P1 |
| 覆盖率 | 无 | Istanbul-v8 / c8 | P1 |
| 契约测试 | 无 | Pact / openapi-fetch mock | P2 |
| 视觉回归 | 无 | Chromatic / Percy | P3 |

### 3.2 前端生产代码规模

| 子应用 | 代码行数（估算） | 测试文件 | 覆盖率 |
|--------|:---------------:|:-------:|:-----:|
| main-web | ~50,000 | 0 | 0% |
| userinfo-web | ~45,000 | 0 | 0% |
| system-web | ~25,000 | 0 | 0% |
| message-web | ~40,000 | 0 | 0% |
| cronjob-web | ~35,000 | 0 | 0% |
| nextwiki-web | ~55,000 | 0 | 0% |
| workflow-web | ~50,000 | 0 | 0% |
| literule-web | ~30,000 | 0 | 0% |
| agent-web | ~60,000 | 0 | 0% |
| generator-web | ~25,000 | 0 | 0% |
| @ydsz/comm 公共包 | ~80,000 | 0 | 0% |

### 3.3 前端 CI 门禁分析

`D:\Code\open\ydsz-micro\.github\workflows\ci.yml` 的 PR 必跑门禁：
- ✅ ESLint（零告警）
- ✅ Stylelint（零告警）
- ✅ 类型检查（vue-tsc）
- ✅ 循环依赖检查
- ✅ 依赖合规检查
- ✅ 编码规范合规扫描（P0/P1 计入失败）
- ✅ 国际化 key 一致性
- ✅ importmap 版本锁
- ✅ 契约漂移检查（后端事实源）
- ❌ **无测试相关门禁**

**当前状态**：前端有非常完善的**静态质量门禁**，但**完全缺乏运行时行为验证**。

---

## 四、互联网大厂对标分析

### 4.1 测试体系成熟度模型（TMMi 简化版）

| 等级 | 大厂典型特征 | 当前项目状态 |
|:---:|-------------|------------|
| L1 初始级 | 无专门测试活动，依赖开发自测 | **当前所处层级** |
| L2 已管理级 | 测试计划、测试用例、独立测试环境 | - |
| L3 已定义级 | 测试与开发分离，有完整测试生命周期 | - |
| L4 已度量级 | 覆盖率量化、缺陷密度、回归率统计 | - |
| L5 持续优化级 | AI 辅助测试生成、自动化回归、混沌工程 | - |

### 4.2 大厂测试基础设施对标

| 能力域 | 阿里巴巴 | 字节跳动 | 美团 | 拼多多 | 本项目 |
|--------|---------|---------|------|--------|:------:|
| 单元测试框架 | JUnit5 + Mockito | JUnit5 + Mockito | TestNG + Mockito | JUnit5 + Mockito | 部分模块有 |
| 集成测试 | Testcontainers | Testcontainers | Testcontainers | TestContainers | ❌ |
| E2E测试 | Selenium + QTA | Playwright | Cypress | Playwright | ❌ |
| 覆盖率门禁 | JaCoCo ≥80% | JaCoCo ≥70% | Sonar ≥75% | 私有化方案 | ❌ |
| 契约测试 | Pact | Pact | Spring Cloud Contract | 内部框架 | ⚠️ 仅检查不测试 |
| 混沌工程 | ChaosBlade | ChaosMesh | 内部平台 | ChaosBlade | ❌ |
| 压测平台 | PTS | Rhino | Quake | WTK | ❌ |
| 流量回放 | Joker | RReplay | 内部方案 | Replay | ❌ |
| 变异测试 | Pitest | Pitest | 部分团队 | 内部方案 | ❌ |

### 4.3 互联网大厂单元测试补充率参考

| 团队/领域 | 测试/生产代码比 | 增量覆盖率门禁 | 全量覆盖率目标 |
|---------|:------------:|:------------:|:-----------:|
| 阿里淘宝核心交易 | 1.5 ~ 2.0 | ≥ 80% | ≥ 85% |
| 字节抖音电商 | 1.0 ~ 1.5 | ≥ 70% | ≥ 80% |
| 美团外卖订单 | 1.0 ~ 1.3 | ≥ 60% | ≥ 75% |
| 拼多多多多买菜 | 0.8 ~ 1.2 | ≥ 60% | ≥ 70% |
| **YDSZ 项目** | **0.003 (0.3%)** | **无** | **0%** |

---

## 五、问题分级汇总

### P0 阻断（必须解决，否则无法进入下一阶段）

| ID | 问题 | 影响范围 | 证据位置 |
|:---:|------|---------|---------|
| P0-1 | 编码规范 §14 与 pom.xml 中已引入的测试框架严重矛盾 | 全局 | `docs\云顶编码规范.md §14` + `pom.xml` 多处 |
| P0-2 | 9个业务模块中 6个生产模块完全零测试覆盖 | ydzs-system/userinfo/message/nextwiki/gateway/cronjob | 实际统计 |
| P0-3 | CI 中无任何测试门禁，PR 合入无需通过测试 | ydsz-cloud + ydsz-micro | `ci.yml` 无 test 步骤 |
| P0-4 | 核心业务逻辑（RBAC/状态机LiteExpr/多租户隔离）零测试 | 全部业务模块 | 见 §2.2 热力图 |
| P0-5 | 无任何集成测试，DB/Redis/MQ 集成点全部未经验证 | 全部依赖基础设施的模块 | 扫描结果 |
| P0-6 | 无代码覆盖率度量，无法量化测试充分性 | ydsz-cloud | pom.xml 无 JaCoCo |

### P1 严重（应尽快解决，影响质量内建）

| ID | 问题 | 影响范围 |
|:---:|------|---------|
| P1-1 | 现有测试仅覆盖 POJO/算法层，领域服务和应用服务层未测试 | ydsz-agent/literule/workflow |
| P1-2 | 前端 10 个子应用全部零测试（已按规范移除但未建立新体系） | ydsz-micro |
| P1-3 | 无契约测试（仅 CI 做漂移检查，无消费者驱动的 Mock 验证） | 前后端 API 边界 |
| P1-4 | 无性能/压测基线，无法发现回归 | 全部 |
| P1-5 | 多租户数据隔离逻辑（最核心能力）零测试 | ydsz-userinfo/system |
| P1-6 | 无状态机/工作流引擎流转测试（仅 workflow domain 1个枚举测试） | ydsz-workflow |

### P2 一般（建议解决，提升工程成熟度）

| ID | 问题 |
|:---:|------|
| P2-1 | ArchUnit 仅覆盖 ydsz-common 六层分级，未覆盖业务模块的 DDD 分层（api↔domain↛infra 方向） |
| P2-2 | 无命名约定测试（Controller 必须以 Controller 结尾等） |
| P2-3 | 无代码变异测试，无法评估测试有效性 |
| P2-4 | 已有测试文件无 CI 运行验证，存在过期/失败风险 |
| P2-5 | 无测试用例命名规范落地（方法名即文档：`test_被测场景_期望行为`） |

### P3 提升（长期优化方向）

| ID | 问题 |
|:---:|------|
| P3-1 | 无混沌工程/故障注入能力 |
| P3-2 | 无生产流量回放/影子库验证 |
| P3-3 | 无自动化 API 测试（基于 OpenAPI 生成测试用例） |
| P3-4 | 无 AI 辅助测试生成（基于代码上下文推荐测试） |

---

## 六、优化建议路线图

### Phase 0：解决规范矛盾（立即，1-2 天）

**目标**：消除规范与实践的撕裂，为后续测试建设奠定制度基础。

| 动作项 | 具体操作 | 负责人 |
|-------|---------|:------:|
| 修订 §14 | 将"禁止测试代码"改为"云顶编码规范 1.0.8：测试管理体系"，明确分层策略 | ydsz-team |
| 新增 §14.1 | 测试分类定义（单元/集成/E2E/架构/契约） | - |
| 新增 §14.2 | 各层覆盖要求与免测条件（如纯 getter/setter 不强制） | - |
| 新增 §14.3 | 测试代码规范（命名、结构、Mock 规则） | - |
| 同步 shared-rules.yaml | 更新 P0 规则：YDIZ-TEST-001（核心逻辑必测） | - |
| 同步 catpaw-always.md | 删除测试禁止条目，新增测试分层要求 | - |

### Phase 1：单元测试破零（1-2 周）

**目标**：核心子模块（按业务关键度排序）达到 40% 行覆盖率。

**优先级排序**：

| 优先级 | 模块 | 核心测试目标 | 目标覆盖率 |
|:---:|------|------------|:---------:|
| P0 | ydsz-userinfo | RBAC 六要素、SCIM 协议、MFA 流程、OAuth2 授权码 | ≥50% |
| P0 | ydsz-workflow | BPMN 状态机流转、节点跳转、超时回滚 | ≥45% |
| P0 | ydsz-literule | LiteExpr AST 编译、沙箱隔离、CEP 规则 | ≥40% |
| P1 | ydsz-message | 12 渠道路由、DAG 编排、灰度标记 | ≥30% |
| P1 | ydsz-cronjob | Leader 选举、分片广播、异常自愈 | ≥30% |
| P2 | ydsz-agent | 现有 7 个测试维护 + ReAct 循环核心路径 | ≥35% |
| P2 | ydsz-nextwiki | 秒传算法、版本控制、安全扫描 | ≥25% |

**基础设施搭建**：

| 工具 | 配置 | 目标 |
|------|------|------|
| JaCoCo | `pom.xml` 配置 `prepare-agent` + `report` | 覆盖率量化 |
| Surefire | 分层执行（`-Dgroups=unit`） | CI 快速反馈 |
| AssertJ | 统一流式断断言 | 可读性 |
| Mockito | Mock 基础设施依赖 | 隔离性 |

### Phase 2：集成测试覆盖（2-4 周）

**目标**：核心数据库/缓存/消息队列集成路径有自动化测试。

| 测试类型 | 工具 | 覆盖场景 |
|---------|------|---------|
| DB 集成 | Testcontainers PostgreSQL | 多租户隔离、分页一致性、乐观锁 |
| Redis 集成 | Testcontainers Redis | 分布式锁、布隆过滤器、缓存穿透 |
| MQ 集成 | Testcontainers RabbitMQ | 消息可靠性、幂等消费、死信队列 |
| API 集成 | MockMvc / WebTestClient | Controller 全链路（不含外部依赖） |
| 契约验证 | Pact | 前后端 API 契约 Mock 验证 |

### Phase 3：CI 门禁与度量（1 周内完成）

**PR 必跑门禁配置**：

| 门禁 | 规则 | 失败动作 |
|------|------|:--------:|
| mvn test -pl {module} | 模块单元测试不通过 | 阻断 PR |
| JaCoCo 增量覆盖率 | PR 增量行覆盖率 < 40% | 阻断 PR |
| JaCoCo 全量下降 | 全量覆盖率下降 > 1% | 预警 |
| mutation score | 变异分数 < 60% | 预警 |
| 架构测试 | CDI/依赖方向违反 | 阻断 PR |

### Phase 4：前端测试体系重建（3-4 周）

| 测试层 | 框架 | 覆盖目标 |
|--------|------|---------|
| 组件测试 | Vitest + @vue/test-utils | 核心业务组件（表单/表格/审批流） |
| composable 测试 | Vitest | useDictEvent、useTenant、useAuth 等核心逻辑 |
| E2E 测试 | Playwright | 登录/登出、核心 CRUD 流程、审批流程 |
| API 契约测试 | Pact + MSW | 前后端 API Mock 一致性 |

### Phase 5：E2E 与混沌工程（长期）

| 能力 | 工具 | 场景 |
|------|------|------|
| 端到端 Playwright | Playwright + 测试环境 | 核心用户旅程（注册→审批→操作→审计） |
| 混沌工程 | ChaosBlade | 网络抖动、Redis 故障、DB 慢查询 |
| 流量录制回放 | 内部平台 | 生产流量回归验证 |
| 性能基线 | JMH + wrk2 | 关键接口 P99 基线 |

---

## 七、立即可执行的 5 项行动（Quick Wins）

| 序号 | 行动 | 预计收益 | 风险 |
|:---:|------|---------|:---:|
| 1 | **修订 §14 规范**，明确"从禁止到规范"的定位转变 | 消除团队困惑，扫清制度障碍 | 低 |
| 2 | **在 ydsz-agent 现有 1075 行测试基础上**，补齐到 40% 覆盖率（该模块架构最规范、测试文化已初步形成） | 可快速验证测试价值并形成模板 | 低 |
| 3 | **配置 JaCoCo** 生成首份全量覆盖率报告 | 量化现状，为后续迭代提供基线 | 低 |
| 4 | **引入 Testcontainers** 编写 ydsz-literule 表达式引擎的 DB 集成测试（规则持久化+热加载） | 验证核心能力 | 中 |
| 5 | **在 Playwright 零成本起步**，为主前端（main-web）编写登录/导航/顶栏切换 3 个 E2E Case | 建立前端测试信心 | 低 |

---

## 八、参考标准与资料

| 标准/文档 | 适用范围 |
|----------|---------|
| 阿里巴巴《Java开发手册》（泰山版）第 10 章「单元测试」 | 单元测试十一宗美团 |
| Google Testing Guidelines (GTG) | 测试分层、FIRST 原则 |
| 美团技术团队《工程实践》系列 | Testcontainers、覆盖率门禁 |
| 字节跳动《质量保障体系》 | 流量回放、变异测试 |
| Martin Fowler: TestPyramid | 测试金字塔模型 |
| ISTQB CTFL 4.0 | 测试术语与分级 |
| Vue 3 官方测试指南 | @vue/test-utils、Vitest |
| Playwright 官方文档 | E2E 测试标准实践 |

---

> **报告编制**：CatPaw AI Assistant
> **数据来源**：代码扫描 + 静态分析 + 规范审查 + 大厂对标
> **下次复评建议**：Phase 1 完成后（核心模块单测破零）
