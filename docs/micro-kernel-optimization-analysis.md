# micro-kernel 架构审计与优化建议

> 基于 v4.0 代码现状，对标 qiankun / wujie / micro-app / Garfish 等主流微前端方案，结合大厂研发规范（字节跳动 Web 架构、阿里云微前端、美团内部标准等），从架构、功能、性能、体验、过度设计五个维度给出可落地的优化建议。

---

## 一、现状概览

### 1.1 模块职责

`@remi/micro-kernel` 是 remi-micro 项目的核心微前端运行时，基于 ESM 原生动态导入实现同源子应用集群管理。当前能力覆盖：

| 维度 | 现状能力 |
|------|----------|
| 资源加载 | Manifest 加载 + ESM dynamic import + 超时重试 |
| 沙箱隔离 | 快照沙箱 / Proxy fakeWindow / iframe 三模式 |
| 生命周期 | beforeLoad / afterLoad / beforeMount / afterMount / afterUnmount / error |
| 保活 | LRU + TTL + Pin + visibility 自动释放 |
| 通信 | globalState pub-sub + 消息点对点 request/response |
| 预加载 | idle 预热 + 路由预测马尔可夫链 + Speculation Rules API |
| 灰度 | Canary 分流（白名单 + 哈希 + 远程配置） |
| 降级 | 三级降级（静默重试 → UI 占位 → 整页跳转） |
| 可观测性 | Performance API + DevTools 面板 + Chrome Extension Bridge |

### 1.2 对标竞品能力矩阵

| 能力 | micro-kernel (当前) | qiankun | wujie | micro-app | Garfish |
|------|---------------------|---------|-------|-----------|---------|
| 沙箱类型 | 3 种 | snapshot/proxy/legacy | iframe + webcomponent | webcomponent + iframe | snapshot/proxy |
| keep-alive | LRU + TTL + Pin | 无原生 | 有 | 有（rerender） | 有 |
| 路由预测 | 马尔可夫链 | 无 | 无 | 无 | 无 |
| 灰度分流 | 有（自研） | 无 | 无 | 有限 | 有 |
| 通信 | pub-sub + req-res | props + globalState | props + bus | 数据属性 | props + bus |
| 预加载 | 多策略 | prefetch | 按需 | 预加载 | prefetch |
| 跨域子应用 | 不支持 | 支持 | 支持 | iframe 模式 | 支持 |

---

## 二、架构优化（Architecture）

### 2.1 [P0] 模块级单例状态是否已完全收归闭包

**现状**：代码注释记录了 P0-A2 修复，将 `_globalState`、`lifecycleHooks`、`activeAppName`、`switchToken` 收进 `createKernel` 闭包，但以下模块仍使用模块级可变状态：

1. `scheduler.ts` 第 215 行：`const appInstances = new Map<string, AppInstance>()` — 模块级 Map
2. `scheduler.ts` 第 101-102 行：`let maxKeepAliveApps = 5` / `let keepAliveTTL = 30 * 60 * 1_000` — 模块级变量
3. `route-predictor.ts` 第 351 行：`let instance: RoutePredictor | null = null` — 模块级单例
4. `message-broker.ts` 第 65-68 行：`handlers` / `pendingRequests` — 模块级 Map/Set
5. `error-boundary.ts` 第 137 行：`degradedApps` — 模块级 Set
6. `loader.ts` 第 77 行：`manifestCache` — 模块级 Map

**问题**：这些模块级状态的 reset 依赖于 `_stop()` 中的显式调用链。如果某个管理器遗漏 reset（如新增模块时），HMR / 测试场景下会状态串扰。

**建议**：采用「管理器注册表」模式 — 定义 `ManagerRegistry` 类统一注册所有管理器，每个管理器实现 `dispose()` 接口，`createKernel` 闭包内创建 registry 实例，由 registry 统一管理生命周期。

```ts
// 示例方向（非完整实现）
interface KernelManager {
  dispose(): void | Promise<void>;
}

class ManagerRegistry {
  private managers = new Set<KernelManager>();
  register(m: KernelManager) { this.managers.add(m); }
  async disposeAll() {
    await Promise.all([...managers].map(m => m.dispose()));
  }
}
```

**对标**：Garfish 的 `Garfish` 类将所有管理器聚合到内核实例内部，每次实例化产生完全独立的运行时状态。

---

### 2.2 [P1] kernel.ts 文件膨胀 — 职责拆分

**现状**：`kernel.ts` 约 930 行，承载了路由同步、应用切换、全局状态管理、生命周期调度、预加载策略、健康检查等过多职责。

**建议**：按职责拆分为独立模块：

```
src/
  kernel.ts              ← 仅保留内核编排入口（约 200 行）
  kernel/
    route-sync.ts        ← 路由监听 + activeRule 匹配
    app-switcher.ts      ← 应用切换令牌 + switchToApp
    global-state.ts      ← 闭包级 _globalState
    lifecycle-hooks.ts   ← lifecycleHooks Map + runHooks/runErrorHooks
    prefetch-bootstrap.ts ← start() 内的预加载初始化
    api-surface.ts       ← kernelApi 对象构造
```

**对标**：qiankun 的 `index.ts` 仅编排，`src/register.ts`、`src/degrade.ts` 等各司其职；字节跳动 micro-app 也将解析器、沙箱、事件系统拆分为独立目录。

---

### 2.3 [P1] 沙箱策略模式缺失统一抽象

**现状**：`scheduler.ts` 激活/卸载逻辑中存在大量 if-else 分支判断 `sandboxType`（第 409-466、490-501、565-586 行）。如果未来新增沙箱类型（如基于 `ShadowRealm` 的原生隔离），需修改多处。

**建议**：`sandbox-strategy.ts` 已有策略接口定义，但调度器未真正使用。应确保 `Scheduler` 完全依赖 `SandboxStrategy` 接口，将 `enterSandbox/exitSandbox`、`createProxySandbox`、`createIframeSandbox` 统一为策略实现。

```ts
// sandbox-strategy.ts 已定义但未在 scheduler 闭环使用
interface SandboxStrategy {
  activate(app: AppInstance): void;
  deactivate(app: AppInstance): void;
  cleanup(app: AppInstance): void;
}
```

---

### 2.4 [P2] micro-runtime 接口层与内核的单向依赖验证

**现状**：`micro-runtime` 定义 `MicroRuntime` 接口，`micro-kernel` 实现它。但部分 kernel 导出的类型/工具函数与 runtime 模块产生了循环引用风险（如 `semver` 从 runtime 导入再被 kernel 重导出）。

**建议**：确保依赖方向严格为 `apps/* → micro-runtime ← micro-kernel`，kernel 不应向 runtime 反向注入类型。`semver` 等公共工具可下沉到 `@remi-core/shared` 或独立 `@remi/semver` 包。

---

## 三、功能增强（Features）

### 3.1 [P1] 子应用 update 生命周期缺失实现

**现状**：`LifecycleExports` 定义了 `update?(props)` 方法，但 `scheduler.ts` 的 activateApp 从未调用。当主应用向子注入新 props（如切换租户、切换主题）时通知子应用更新。

**建议**：在 `scheduler.ts` 增加 `updateProps(appName, newProps)` API，调用子实例的 `exports.update`。这是 qiankun 的核心能力之一。

---

### 3.2 [P1] 预加载策略缺乏 Telemetry — 命中率/预热效果不可观测

**现状**：`preload-strategy.ts` 注册了多种策略（idle / frequency / route / hover），但没有命中率统计、预热效果对比等度量。

**建议**：为 `PreloadManager` 增加 `stats` 字段：

```ts
interface PreloadStats {
  preloadCount: number;          // 预加载触发次数
  consumedCount: number;         // 预热命中激活次数
  wastedCount: number;           // 预加载后未被使用
  avgPreloadToMountTime: number; // 从预加载到激活的平均耗时
}
```

通过 DevTools 面板展示预热命中率，为策略调优提供数据支撑。

---

### 3.3 [P2] 路由预测模型缺乏冷启动补偿

**现状**：`RoutePredictor` 基于马尔可夫链一阶转移概率。新用户无历史数据时 predict 返回空数组，所有预加载机会丢失。

**建议**：引入「全局热门应用」兜底策略。当用户无历史转移记录时，退回到全局频率最高的 top-N 应用做预加载。可维护一份 `globalAppUsage` 存储在 IndexedDB 中。

**对标**：Google 的 Prerender Speculation Rules + Chrome 的 Back/Forward Cache 都使用了类似的「全局统计兜底」策略。

---

### 3.4 [P2] iframe 沙箱子应用独立运行能力不足

**现状**：子应用 ESM 模块在主 realm 执行，iframe 仅提供 CSS/DOM 隔离容器。子应用无法真正独立运行调试（dev 模式下 ESM 入口已经加载完毕，iframe 内无 JS 上下文）。

**建议**：保留 iframe 容器 ESM 执行路线（与项目 ESM 路线一致），但为 dev 模式提供「独立 iframe 运行」选项 — 通过 `<iframe src="子应用 dev server URL">` 加载完整子应用，方便开发调试。

---

### 3.5 [P2] 权限检查器与预加载的联动粒度

**现状**：`StartOptions.permissionChecker` 在 `start()` 时注入 `preloadManager`，但检查器只在预加载阶段影响，不影响 `switchToApp` 路由同步时的子应用激活。

**建议**：将权限检查逻辑扩展为 `PermissionGuard` 接口：

```ts
interface PermissionGuard {
  canLoad(appName: string): boolean;      // 预加载阶段
  canActivate(appName: string): boolean;  // 路由激活阶段
}
```

用户无权限的子应用在菜单中隐藏的同时，也应防止用户通过 URL 直连访问。

---

### 3.6 [P3] 跨域子应用支持（未来规划）

**现状**：所有子应用与主应用同源，不支持 cross-origin 子应用接入。

**建议**：如未来有跨域需求，可参照 qiankun 的 proxy sandbox + import-html-entry 模式，通过正向代理将跨域入口改编为同源。短期不建议投入（复杂度收益比高），但应保持接口层兼容性。

---

## 四、性能提升（Performance）

### 4.1 [P0] performance.mark 过度使用 → 考虑 PerformanceObserver

**现状**：`kernel.ts`、`scheduler.ts`、`message-broker.ts` 散布大量 `performance.mark()` / `measure()` 调用。Performance Timeline 的条目在某些浏览器有数量限制（Chrome 默认 ~1500 条 `measure`），高频路由切换 + 大量子应用可能触发自动截断。

**建议**：引入 `PerformanceObserver` 消费 mark/measure 数据，或将指标聚合后通过 `PerformanceObserver` 转发到监控系统，避免长期驻留 Performance Timeline。

---

### 4.2 [P1] globalState 广播性能 — 全量快照问题

**现状**：`globalStateAPI.setGlobalState(patch)` 广播 `snapshot` 时克隆完整 state 对象。当 state 条目膨胀（如存储主题 token、用户信息、权限码数组等），每次 patch 的序列化成本增长。

**建议**：

1. 采用增量更新 — 仅广播变化的 key/value 对
2. 或引入结构化克隆的替代方案（如 `structuredClone` 替代 `...` 展开）
3. 大型 state 切片建议下沉到子应用模块状态，不经过内核广播

---

### 4.3 [P1] LRU 淘汰排序的算法复杂度

**现状**：`evictKeepAliveIfNeeded()` 第 753 行调用 `cached.sort()`，每次 deactivate 触发时全量排序。缓存实例数较少时（<10）影响不大，但假如未来扩展保活上限到 20+，O(n log n) 可优化为 O(log n) 的优先队列。

**建议**：KeepAliveTracker 使用 `MinHeap`（最小堆）或始终维护一个按 `lastActivatedAt` 排序的 `SortedSet`。当前轻量场景下此优化可延后。

---

### 4.4 [P2] 路由匹配的 activeRule 遍历

**现状**：`startRouterSync()` 的 `handleRouteChange()` 使用 for 循环线性遍历 `routerApps`，逐个匹配 `activeRule`（第 527-541 行）。应用数 N 增多时，每次路由变更的匹配成本 O(N)。

**建议**：

1. 对 string 类型 activeRule 构建 `Map<activeRule, MicroAppConfig>` 索引，O(1) 查找
2. 对 RegExp / function 类型归为「慢路径」fallback 数组，仅在精确匹配失败时遍历
3. 实际场景 N < 20 时 O(N) 影响甚微，但工程上为未来扩展留下空间

---

### 4.5 [P2] 预加载并发控制器的 Worker 饥饿问题

**现状**：`runWithConcurrency` 第 194 行的 while 循环在 `await fn(item)` 期间 worker 阻塞。如果单个预加载任务耗时极大（如某个子应用首屏 chunk 很大），后续 worker 全部等待。更合理的实现是使用游标 + 即时消费式队列。

**建议**：当前实现已足够（参照 p-limit 源码），但可考虑将 `worker()` 中的 `while` 改为基于游标的即时消费模式以降低内存峰值：

```ts
// 当前: items[index++] 在开始时取，worker 内 await 期间 index 不变
// 更优: 在 await 前立即取，释放引用
```

实际差异微乎其微，此项仅作理论完善。

---

### 4.6 [P2] ESM Manifest 缓存 — LRU 淘汰

**现状**：`manifestCache` 为无界 Map，长期运行下（OTA 升级后 manifest URL 变化）可能内存泄漏。

**建议**：为 manifestCache 接入简单的 LRU（如限制 50 条 + 按最后访问时间淘汰）。或使用 `WeakRef` + `FinalizationRegistry` 实现 GC 友好的缓存。

---

## 五、体验改善（Developer & User Experience）

### 5.1 [P0] 错误降级 UI — i18n 未覆盖全量静态文本

**现状**：`error-boundary.ts` 提供 zh-CN / en-US 两套消息，但主应用通过 `setErrorFallbackMessages()` 注入时要求业务方手动配置。且在 SSR / 无 `preferences` 模块的流程中无法同步。

**建议**：

1. 错误 UI 的默认文本应同时读取 `localStorage` 中的语言偏好（作为 preferences 不可用时的 fallback）
2. 提供 `registerErrorMessages(locale, messages)` 支持运行时动态注册新语言

---

### 5.2 [P1] DevTools Panel 缺少性能指标聚合视图

**现状**：`devtools-panel.ts` 展示内核状态和子应用列表，但 Web Vitals 指标（LCP / FID / CLS / INP）和内核自定义 measure（`kernel:route:*`、`kernel:mount:*`）未集成。

**建议**：

1. 在 DevTools Panel 中增加「性能」tab，通过 `performance.getEntriesByType('measure')` 筛选 kernel:* 条目
2. 展示每个子应用的「加载耗时 P50/P95/P99」「激活耗时」「卸载耗时」
3. 对标 Chrome DevTools Performance Panel 的体验

---

### 5.3 [P1] 预加载策略效果可视化

**现状**：`getPreloadManager()` 返回 preloadManager 实例，但其内部状态（策略列表、hover 监听器、权限过滤结果）无法在 DevTools 中观察到。

**建议**：`PreloadManager` 增加 `debugInfo()` 方法，返回当前策略配置 + 预加载缓存状态 + 历史命中次数。DevTools 面板订阅此接口展示预加载运行健康状况。

---

### 5.4 [P2] HMR 场景下子应用切换的体验连贯性

**现状**：主应用 HMR 触发 `_stop()` 清理所有实例，子应用状态丢失。刷新后预加载策略重置，路由预测器从 localStorage 恢复但内存状态清空。

**建议**：

1. RoutePredictor 的转移矩阵在 `_stop()` 时主动 flush，而非仅依赖 5s 节流
2. 或将 RoutePredictor 的 `transitions` / `totals` 设计为持久化优先（写时复制 + IndexedDB），reset 后立即从磁盘加载

---

### 5.5 [P2] 子应用加载的错误分类与日志可观测性

**现状**：`loadApp` 失败时仅 `throw Error(message)`，不区分错误类型（网络超时 / 404 / 生命周期格式错误 / 业务异常）。Sentry 等平台聚合错误时难以分类。

**建议**：引入 `KernelError` 类，增加 `errorCode` 字段：

```ts
enum KernelErrorCode {
  LOAD_TIMEOUT = 'LOAD_TIMEOUT',
  LOAD_NETWORK = 'LOAD_NETWORK',
  LOAD_MANIFEST_INVALID = 'LOAD_MANIFEST_INVALID',
  LIFECYCLE_MISSING = 'LIFECYCLE_MISSING',
  MOUNT_ERROR = 'MOUNT_ERROR',
  SANDBOX_ERROR = 'SANDBOX_ERROR',
}
```

Sentry / 监控系统可按 errorCode 聚合报警。

---

### 5.6 [P3] 子应用间的样式隔离增强 — CSS Module Scope 自动注入

**现状**：依赖 PostCSS 构建期 CSS scoping，但如果子应用遗漏 PostCSS 配置或使用 `:global` 选择器时仍可能样式泄露。

**建议**：沙箱激活时动态为子应用容器注入 `data-micro-app` 属性（已实现），并在加载阶段追加 `<style data-micro-kernel-scope>[data-micro-app="xxx"] { /* 隔离重置 */ }</style>` 作为兜底。或参照 micro-app 的 `scope-css` 运行时转换。

---

## 六、过度设计评估（Over-Engineering Audit）

### 6.1 [O1] 路由预测马尔可夫链 — ROI 评估

**现状**：`RoutePredictor` 是一阶马尔可夫链模型，使用 + 衰减 + 持久化 · 路由跳转预加载候选。但其命中率取决于用户的导航模式（是否有明确的「主 → 子」跳转序列）。如果用户导航模式随机、或由外链驱动，模型难以积累有效转移概率。

**建议**：

- 保留实现，但增加统计「命中激活率」的 telemerty
- 当命中率 < 5% 时建议关闭预测预加载，回退到 idle 策略
- 或简化为「最近 N 次访问频率统计」的朴素模型，降低认知负担
- 当前实现「不过度」，但配套的衰减 / 持久化 / 条目上限调参曲线需要场景验证

---

### 6.2 [O2] 三级降级策略 — 配置复杂度

**现状**：auto-retry → show-ui → full-page 三档，配置参数含 `MAX_AUTO_RETRIES` / `MAX_MICRO_RETRIES` / 退避延迟基数 / jitter 范围。对最终用户透明无需了解，但内核开发者需要管理多组参数。

**建议**：

- 当前参数数量（4-5 个）尚可接受
- 如需简化：合并为「重试次数 + 重试模式（silent / noisy）」两参数
- 退避策略统一为 `min(base * 2^n + jitter, maxDelay)` 标准实现，无需暴露 jitter 参数

---

### 6.3 [O3] Canary 灰度分流 — 本地配置 + 远端拉取双轨的维护成本

**现状**：Canary 分支功能中实现了：FNV-1a 分流 / 远程配置拉取 / 自动刷新定时器 / 本地缓存 / 内核版本兼容性检查 / 白名单强制命中。能力完整但复杂度高。

**评估**：对于中小规模团队（< 10 个前端维护子应用），Canary 分流带来的发版灵活性与维护成本的比值需要验证：

- 如果发版频率低（< 1 次 / 周），建议仅保留「白名单 + 显式 tag 开关」的简化版
- 如果有高频 A/B 实验需求，当前实现合理
- 建议：`CanaryManager.init()` 增加 `mode: 'simple' | 'advanced'` 两档，simple 模式仅用本地配置 + 远程拉取，不维护自动刷新定时器

---

### 6.4 [O4] Speculation Rules API 依赖度评估

**现状**：`speculation-rules.ts` 在 `start()` 时注入 `<script type="speculationrules">` 预取规则。但：

1. 仅 Chromium 内核浏览器支持（Safari / Firefox 不支持）
2. `prefetchStrategy: 'eager'` 才激活此路径
3. 规则本身与 `preload-strategy.ts` 的预加载可能「双预定」— 预取 + 预加载同时触发，浪费带宽

**建议**：

- 保留但默认关闭（仅在 `eager` 模式下启用），避免 lazy 模式下双预定
- 注入 Speculation Rules 前检查 `loadApp` 是否已将目标 URL 加载到浏览器缓存，若是则跳过注入

---

## 七、优先级排序汇总

| 优先级 | 维度 | 建议 | 预估工期 |
|--------|------|------|----------|
| **P0** | 架构 | 模块级状态统一收归 ManagerRegistry | 2d |
| **P0** | 性能 | performance.mark 过载防护 | 0.5d |
| **P0** | 体验 | 错误降级 i18n fallback 到 localStorage | 0.5d |
| **P1** | 功能 | 子应用 update 生命周期实现 | 1d |
| **P1** | 功能 | 预加载命中率统计 | 1d |
| **P1** | 功能 | 权限守卫扩展到路由激活阶段 | 0.5d |
| **P1** | 功能 | 路由预测冷启动兜底 | 0.5d |
| **P1** | 性能 | globalState 增量广播替代全量克隆 | 1d |
| **P1** | 架构 | kernel.ts 按职责拆分为子模块 | 1.5d |
| **P1** | 体验 | DevTools 性能面板 | 1d |
| **P1** | 体验 | 错误分类 errorCode | 0.5d |
| **P2** | 功能 | iframe 子应用独立 dev 运行 | 1d |
| **P2** | 性能 | 路由匹配索引优化 | 0.5d |
| **P2** | 性能 | manifestCache 条数上限 | 0.5d |
| **P2** | 体验 | HMR 场景预加载策略保持连贯 | 1d |
| **P3** | 功能 | CSS Module Scope 运行时兜底 | 1.5d |
| **P3** | 功能 | 跨域子应用方向性研究 | - |

---

## 八、非功能维度建议

### 8.1 测试覆盖率

当前 `package.json` 有 `vitest run --reporter=verbose` 脚本，但建议补充：

- `runWithConcurrency` 的并发正确性测试
- `RoutePredictor` 的指数衰减准确性测试
- `evictKeepAliveIfNeeded` 的 LRU 顺序 / pin 保护 / TTL 过期测试
- `switchToApp` 的令牌竞态测试（模拟快速连续路由切换）
- `createKernel` 闭包独立性的 HMR 模拟测试

### 8.2 类型沉淀

部分函数参数使用 `any`（如 `iframe-sandbox.ts` 第 529、413 行）。建议完善类型定义，确保 `pnpm typecheck` 零 error。

### 8.3 Bundle Size 监控

微前端运行时本身应轻量。建议在 CI 中加入 bundle-size 检查：`@remi/micro-kernel` 的发布产物控制在 50KB 以内（gzip）。

---

## 九、总结

micro-kernel v4.0 在能力覆盖度上已达到主流开源微前端框架的水平，并在路由预测、灰度分流等方向有所创新。当前最突出的架构风险是**模块级状态收归不彻底**和**kernel.ts 文件膨胀**；最明显的体验提升空间在**错误分类**和**DevTools 性能可视化**。

建议优先完成 P0 项（状态收归 + mark 防护），再按体验改善节奏推进 P1 功能增强。路由预测和灰度分流作为差异化能力应持续收集业务数据验证 ROI。

---

*分析日期：2026-08-05*
*分析范围：`comm/effects/micro-kernel/` 全部源文件 + `main/src/bootstrap.ts`*
