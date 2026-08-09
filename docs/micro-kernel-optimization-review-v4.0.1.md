# micro-kernel v4.0.1 深度优化建议（基于最新代码现状）

> 对标行业主流竞品（qiankun / wujie / micro-app / Garfish）与互联网大厂研发规范（字节跳动 Web 架构、阿里云微前端、美团前端技术中心标准），基于 `comm/effects/micro-kernel/` 最新 v4.0.1 代码，从架构、功能、性能、体验、过度设计五个维度输出可落地的优化建议。

---

## 一、v4.0 → v4.0.1 优化落地审计

### 1.1 已实现的 P0 / P1 项（docs 中建议已落地）

| 编号 | 建议 | 落地位置 | 状态 |
|------|------|---------|------|
| P0-A2 | 闭包状态收归 createKernel | kernel.ts#L107-165 | ✅ 已完成 |
| P0-A1 | ManagerRegistry 统一生命周期 | manager-registry.ts + scheduler.ts#L958 | ✅ 已完成 |
| P0-3 | 错误降级 i18n 回退 localStorage | error-boundary.ts#L77-112 | ✅ 已完成 |
| P0-E1 | XSS escapeHtml 防护 | error-boundary.ts#L120-127 | ✅ 已完成 |
| P1-1 | update 子应用 props 生命周期 | scheduler.ts#L940-951 + kernel.ts#L651-670 | ✅ 已完成 |
| P1-2 | 预加载命中率统计 (PreloadManager.debugInfo) | preload-strategy.ts#L306-334 | ✅ 已完成 |
| P1-4 | 路由预测冷启动 fallback | route-predictor.ts#L218-247 | ✅ 已完成 |
| P1-3 | 路由激活权限守卫 (onRouteActivate) | kernel.ts#L419-421 | ✅ 已完成 |
| P1-8 | KernelError / KernelErrorCode 错误分类 | error-boundary.ts#L28-64 | ✅ 已完成 |
| P2-3 | manifestCache LRU 50 条上限 | loader.ts#L80-103 | ✅ 已完成 |
| P0-2 | mark 缓冲区保护 (1000/500) | performance-utils.ts#L24-84 | ✅ 已完成 |
| P2-2 | activeRule string 索引 | kernel.ts#L379-401 | ✅ 已完成 |
| P2-3 | sandbox-strategy.ts 接口定义 | sandbox-strategy.ts | ✅ 已完成 |
| — | globalState 增量广播 | kernel.ts#L154-157 | ✅ 已完成 |
| — | HMR RoutePredictor flush | kernel.ts#L807-809 | ✅ 已完成 |

### 1.2 残留差距（仍需重点攻坚）

| 维度 | 问题 | 严重度 |
|------|------|--------|
| 架构 | sandbox-strategy 接口在 scheduler 中未使用，仍 if-else 分支 | 🔴 P0 |
| 架构 | 模块级状态仅 scheduler 纳入 ManagerRegistry，其余 7+ 模块仍是裸单例 | 🟠 P1 |
| 架构 | kernel.ts 仍 871 行，含路由同步、应用切换编排等可进一步拆分 | 🟡 P2 |
| 性能 | globalState getGlobalState() 仍克隆全量 | 🟡 P2 |
| 体验 | scheduler 抛出的异常未统一包装为 KernelError | 🟠 P1 |
| 质量 | 缺少 ManagerRegistry 独立性与闭包隔离度的自动化测试 | 🟠 P1 |

---

## 二、架构优化（Architecture）

### 2.1 [P0] sandbox-strategy 接口闭环使用 — 消除 scheduler 中的 if-else

**现状**：`sandbox-strategy.ts` 已定义 `SandboxStrategy` 接口与三种适配器（SnapshotSandboxStrategy / ProxySandboxStrategy / IframeSandboxStrategy），但 `scheduler.ts` 的 `activateApp` / `deactivateApp` / `evictSingleInstance` / `evictAllKeepAliveOnMemoryPressure` 四处仍通过 `if (instance.sandboxType === 'proxy') { ... } else if (instance.sandboxType === 'iframe') { ... } else { ... }` 分支处理，与策略接口形成「并行实现」。

**问题**：
- 新增沙箱类型（如 `ShadowRealm`、`Worker`）需修改 scheduler 多处，违反 OCP
- `IframeSandboxStrategy` 暴露的 `callRpc` / `registerMainApi` 等额外能力在 scheduler 中难以触及
- 代码重复率高：`evictSingleInstance` 与 `deactivateApp` 后半段几乎完全相同

**建议**：

```ts
// === 重构方向（非完整实现）===
// AppInstance 中将三字段合并为单一 strategy:
interface AppInstance {
  // 移除: sandbox / proxySandbox / iframeSandbox
  strategy: SandboxStrategy;  // 统一由 createSandboxStrategy(type, ...) 创建
}

// activateApp 中:
const strategy = instance.strategy;
strategy.mount();
// 传 mountProps 的特有能力通过可选注入
if (strategy.type === 'proxy') mountProps.fakeWindow = strategy.fakeWindow;
if (strategy.type === 'iframe') {
  mountProps.container = strategy.container ?? mountProps.container;
  mountProps.iframeWindow = strategy.contentWindow;
}

// deactivateApp 中:
strategy.unmount();
```

**对标**：micro-app 将沙箱抽象为 `Sandbox` 基类，scheduler 无需感知具体类型；Garfish 通过 `App` 实例持有沙箱引用，调度器只调用 `app.mount()` / `app.unmount()`。

**预估工期**：2.5d（含测试补齐）

---

### 2.2 [P1] 模块级裸单例纳入 ManagerRegistry

**现状**：`ManagerRegistry` 已在 kernel 闭包中创建，但仅 `createSchedulerManager()` 在 `_stop()` 时动态注册，其余模块仍是模块级 `let instance` 单例：

| 模块 | 裸单例变量 | reset 函数 |
|------|-----------|-----------|
| scheduler.ts | `appInstances` / `maxKeepAliveApps` / `keepAliveTTL` | `resetScheduler()` |
| error-boundary.ts | `degradedApps` / `retryCounters` | `clearDegraded()` / 无清除 |
| message-broker.ts | `handlers` / `pendingRequests` | `clearPendingRequests()` |
| route-predictor.ts | `instance` | `resetRoutePredictor()` |
| canary-manager.ts | `instance` | `resetCanaryManager()` |
| version-manager.ts | `versionManagerInstance` | `resetVersionManager()` |
| preload-strategy.ts | `preloadManagerInstance` | `resetPreloadManager()` |

**问题**：`_stop()` 中的调用链仍是**命令式逐一调用**，新增模块时若忘记在 `_stop()` 中补充 reset，HMR 场景状态串扰。

**建议**：实现「自注册」模式 + 工厂延迟初始化：

```ts
// kernel.ts createKernel 闭包内
const registry = createManagerRegistry();

registerMicroManagers(registry);

function registerMicroManagers(registry: ManagerRegistry) {
  registry.register({
    name: 'scheduler',
    dispose: () => { /* resetScheduler 逻辑 */ }
  });
  registry.register({
    name: 'error-boundary',
    dispose: () => {
      clearDegraded();
      retryCounters.clear();  // 暴露清除函数
    }
  });
  registry.register({
    name: 'preload-strategy',
    dispose: () => preloadManagerInstance?.destroy() ?? undefined
  });
  registry.register({
    name: 'route-predictor',
    dispose: () => resetRoutePredictor()
  });
  registry.register({
    name: 'canary-manager',
    dispose: () => resetCanaryManager()
  });
  registry.register({
    name: 'version-manager',
    dispose: () => resetVersionManager()
  });
  registry.register({
    name: 'message-broker',
    dispose: () => clearPendingRequests()
  });
}

// _stop() 中简化为:
await registry.disposeAll();
```

**收益**：新增管理器只需在 `registerMicroManagers` 增加一行，`_stop()` 无需修改。

**预估工期**：1.5d

---

### 2.3 [P2] kernel.ts 职责二次拆分 — 路由同步独立

**现状**：`kernel.ts` 从 v4.0 初版的 ~930 行经 `kernel-helpers.ts` 拆分后降至 871 行，但仍包含：
- `switchToApp` — 应用切换核心逻辑（含令牌并发控制）
- `startRouterSync` — 路由监听 + activeRule 匹配（~70 行）
- `registerAppsInternal` — 注册去重 + manifest 预热
- 闭包状态初始化（`_globalState`, `lifecycleHooks`, `activeAppName` 等）

**建议**：将 `switchToApp` + `startRouterSync` 组合为 `kernel/app-switcher.ts`：

```
src/
  kernel.ts                   ← 缩减至 ~300 行，仅保留闭包工厂 + api-surface 装配
  kernel/
    app-switcher.ts           ← switchToApp + startRouterSync（~200 行）
    global-state.ts           ← createGlobalState() 工厂（~80 行）
    lifecycle-hooks.ts        ← addLifecycleHook + runHooks/runErrorHooks（~60 行）
    register-apps.ts          ← registerAppsInternal + 预热逻辑（~50 行）
    prefetch-bootstrap.ts     ← start() 内的预加载初始化（~80 行）
```

**对标**：
- qiankun `src/register.ts` 独立管理注册流程
- Garfish 将 `Garfish` 主类与 `AppInstance` 拆分为独立文件
- 字节 micro-app /packages/micro-app 将路由、沙箱、事件分为独立目录

**预估工期**：2d（需谨慎避免破坏闭包变量访问关系）

---

### 2.4 [P2] micro-runtime 依赖方向校验

**现状**：`index.ts` 第 109 行 `export { satisfiesVersion, parseVersion, compareVersion } from '@ydsz/micro-runtime/semver'`，存在 kernel → runtime 的重导出。`canary-manager.ts` 也直接 `import { satisfiesVersion } from '@ydsz/micro-runtime/semver'`。

**建议**：
1. 短期：将 `@ydsz/micro-runtime/semver` 重导出下沉到 `@YDSZ-core/shared/semver` 或独立 `@ydsz/semver` 包
2. 长期：kernel 不重导出runtime 类型，外部直接使用 `@ydsz/micro-runtime`

**预估工期**：0.5d

---

## 三、功能增强（Features）

### 3.1 [P2] iframe 沙箱 iframeWindow 事件代理增强

**现状**：iframe 沙箱的 `mountProps.iframeWindow` 注入后，子应用可直接 `postMessage` 与主应用通信，但**未封装统一的消息通道**，子应用需自行处理 `window.addEventListener('message', ...)`。

**建议**：在 `IframeSandboxStrategy` 中提供 `bridge` 对象：

```ts
interface MicroBridge {
  /** 主 → 子 单向消息 */
  send(action: string, payload?: unknown): string;
  /** 子调用主（request/await） */
  call<R = unknown>(action: string, payload?: unknown, timeout?: number): Promise<R>;
  /** 注册子消息处理器 */
  on<T = unknown, R = unknown>(action: string, handler: (payload: T) => R | Promise<R>): () => void;
}
```

对标 qiankun 的 `props.container.querySelector` 注入模式与 micro-app 的 `data` 属性通信。

**预估工期**：1.5d

---

### 3.2 [P2] 批量 updateApp — 全局主题 / 租户切换

**现状**：`updateApp(name, props)` 一次只能更新一个子应用，主题切换需遍历所有已挂载应用逐个调用。

**建议**：增加 `updateAllApps(props)` 一次广播更新所有已挂载子应用：

```ts
async function updateAllApps(props: Record<string, unknown>): Promise<{ success: string[]; failed: string[] }> {
  const all = getAllInstances();
  const mounted = all.filter(i => i.status === 'MOUNTED')
    .filter(i => i.exports?.update);  // 仅通知实现了 update 的子应用

  const results = await Promise.allSettled(
    mounted.map(i => updateAppProps(i, { ...i.config.props, ...props }))
  );
  // 返回成功/失败列表
}
```

**预估工期**：0.5d

---

### 3.3 [P3] 子应用懒注册（运行时按需 addApp）

**现状**：`registerApps` 必须一次性注册所有子应用，无法在运行时动态增加。

**建议**：暴露 `addApp(config)` 运行时追加单个应用配置到 apps 数组，触发 manifest 预热与版本管理器注册。

```ts
function addApp(app: MicroAppConfig): void {
  if (apps.some(a => a.name === app.name)) return;
  apps.push(app);
  createAppInstance(app);
  versionManager.setAppEntries(new Map(apps.map(a => [a.name, a.entry])));
  preloadManifest(app.entry);
}
```

对标 qiankun 的 `registerMicroApps` 支持多次调用增量注册。

**预估工期**：0.5d

---

### 3.4 [P3] 跨域子应用方向性预留

**现状**：子应用强制与主应用同源（ESM 路线限制），不支持 cross-origin。

**短期**：维持现状，不投入。

**长期接口预留**：
1. 在 `MicroAppConfig` 增加 `crossOrigin?: boolean` 字段（接口存在，暂不实现）
2. kernel `registerApps` 内部对 `crossOrigin: true` 应用抛出明确错误提示
3. 未来可参照 qiankun `import-html-entry` 通过正向代理 + HTML 解析实现

---

## 四、性能提升（Performance）

### 4.1 [P1] 错误码在 scheduler 异常路径落地

**现状**：`loader.ts` 已统一使用 `KernelError`（`LOAD_MANIFEST_FETCH` / `LOAD_MANIFEST_INVALID` / `LOAD_ESM_IMPORT` / `LIFECYCLE_MISSING`），但 `scheduler.ts` 的 `activateApp` / `deactivateApp` / `evictSingleInstance` / `evictAllKeepAliveOnMemoryPressure` 捕获异常仅 `instance.error = String(err)`，未包装为 `KernelError(KernelErrorCode.SANDBOX_ERROR / UNMOUNT_ERROR / MOUNT_ERROR)`。

**影响**：Sentry 对 scheduler 错误只能按 message 聚合，无法按 code 精确分类。

**建议**：

```ts
// activateApp catch:
catch (err) {
  const wrapped = new KernelError(
    isMountPhase ? KernelErrorCode.MOUNT_ERROR : KernelErrorCode.SANDBOX_ERROR,
    `[MicroKernel] ${config.name} activation failed: ${String(err)}`,
    err,
  );
  instance.error = wrapped.message;
  throw wrapped;
}

// deactivateApp catch:
catch (err) {
  throw new KernelError(
    KernelErrorCode.UNMOUNT_ERROR,
    `[MicroKernel] ${config.name} unmount failed: ${String(err)}`,
    err,
  );
}
```

**预估工期**：0.5d

---

### 4.2 [P2] globalState getGlobalState 结构化克隆优化

**现状**：`globalStateAPI.getGlobalState()` 返回 `{ ..._globalState }` 浅拷贝。当 state 存储大量数据（如含权限码数组、用户信息对象）时，每次克隆成本 O(n)。而 `setGlobalState` 增量广播已实现（仅传变化的 keys），读路径未对齐。

**建议**：提供 `getStateSnapshot()` 深拷贝（仅给需要完整快照的场景）+ `getGlobalState()` 维持浅拷贝不变。或引入 `structuredClone` 阈值：

```ts
getGlobalState() {
  // 浅拷贝 + 大字段引用标记：监听器按 key 订阅时可避免不相关更新触发
  return new Proxy(_globalState, {
    get(target, prop) { return target[prop]; },
    ownKeys() { return Object.keys(_globalState); },
  });
}
```

**实际影响**：state 条目 < 50 时浅拷贝开销可忽略，此项收益有限。

**预估工期**：0.5d（可选）

---

### 4.3 [P2] LRU 淘汰优先级队列优化

**现状**：`evictKeepAliveIfNeeded()` 使用 `cached.sort((a, b) => a.lastActivatedAt - b.lastActivatedAt)`，每次 deactivate 全量 O(n log n) 排序。

**建议**：应用数 < 10 时维持现状；若未来扩展保活上限到 20+，引入 `MinHeap`。

**现状评估**：当前默认 `maxKeepAliveApps = 5`，无需立即优化。

---

### 4.4 [P2] 预加载并发控制器 Worker 消费模式微调

**现状**：`runWithConcurrency` 在 `while` 循环开始时读取 `items[index++]`，worker await 期间持有 item 引用。

**建议**：理论上可在 await 前立即消费，释放对 items 数组的引用。实际差异可忽略，仅作理论完善。

---

### 4.5 [P2] manifestCache WeakRef + FinalizationRegistry

**现状**：`manifestCache` 已是 LRU Map（50 条上限），短期运行足够。

**建议**：若有内存敏感场景（如嵌入低配设备），可将 manifestCache 改为 `WeakRef<Manifest>` + `FinalizationRegistry`，让 GC 在内存压力时自动回收。当前不建议投入。

---

## 五、体验改善（Developer & User Experience）

### 5.1 [P1] ManagerRegistry 独立性与闭包隔离度的自动化测试

**现状**：缺少对 `createKernel` 闭包独立性的系统测试。HMR `_stop()` 后重新 `createKernel()`，若某模块级状态未正确 reset，会导致状态串扰。

**测试补齐**：

```ts
// __tests__/registry.test.ts
describe('ManagerRegistry', () => {
  it('register 同名管理器应释放旧的', async () => {
    const registry = createManagerRegistry();
    const m1 = { name: 't', dispose: vi.fn() };
    const m2 = { name: 't', dispose: vi.fn() };
    registry.register(m1);
    registry.register(m2);
    expect(m1.dispose).toHaveBeenCalled();  // 旧的先释放
  });

  it('disposeAll 按逆序释放', async () => {
    const order: string[] = [];
    const registry = createManagerRegistry();
    registry.register({ name: 'a', dispose: () => { order.push('a'); } });
    registry.register({ name: 'b', dispose: () => { order.push('b'); } });
    await registry.disposeAll();
    expect(order).toEqual(['b', 'a']);
  });
});

// __tests__/kernel-isolation.test.ts
describe('Kernel HMR isolation', () => {
  it('两次 createKernel 应有独立的 globalState', async () => {
    const k1 = createKernel();
    await k1.start({});
    (k1 as any).globalStateAPI?.setGlobalState?.({ foo: 'bar' });

    await (k1 as any)._stop();

    const k2 = createKernel();
    await k2.start({});
    // k2 不应读到 k1 写入的 state
  });

  it('should 找不到 manager 时返回 undefined', () => {
    const registry = createManagerRegistry();
    expect(registry.get('never-exist')).toBeUndefined();
  });
});
```

**预估工期**：1.5d

---

### 5.2 [P2] DevTools 面板分页 / Tab 视图

**现状**：DevTools 面板在一个滚动容器内堆叠全部信息（子应用状态、性能指标、操作按钮），子应用超过 8 个时面板过长。

**建议**：拆分为三个 Tab：
- 「应用状态」— 子应用列表 + 手动操作
- 「性能指标」— kernel:* measures + 预加载命中率
- 「灰度 / 版本」— 当前 canary 配置 + 版本检查

**对标**：Chrome DevTools Performance / Memory / Network 分 tab 模式。

**预估工期**：1d

---

### 5.3 [P2] 预加载可视化：hover 命中反馈

**现状**：hover 预加载触发后无视觉反馈，用户无法感知「预热是否生效」。

**建议**：hover 触发预加载时在对应 DOM 元素上添加 `data-preloading` 属性，CSS 可定义 `[data-preloading]::after { content: "预热中..." }` 提示。

**预估工期**：0.5d

---

### 5.4 [P3] 子应用样式隔离运行时兜底

**现状**：依赖 PostCSS 构建期 CSS scoping，若子应用遗漏配置仍可能样式泄露。

**建议**：运行时沙箱激活时注入：

```css
[data-micro-app="xxx"] {
  all: initial;  /* 兜底：隔绝部分继承属性（color/font 等） */
}
```

但此规则会阻断主题 token 变量传递，需综合权衡。参照 micro-app 的 `scope-css` 运行时转换。

**当前不建议投入**：构建期已覆盖大多数场景。

---

## 六、过度设计评估（Over-Engineering Audit）

### 6.1 [O1] 路由预测马尔可夫链 — ROI 持续观察

**现状**：`RoutePredictor` 已落地 + 冷启动 fallback + 5s 节流持久化 + 指数衰减 + 500 条上限。`createRoutePreloadStrategy` 基于 `minProbability=0.15` 触发预加载。

**观察指标**：
- `PreloadManager.debugInfo()` 返回的 `hitRate` — 若 < 5% 建议关闭预测预加载
- `topMeasures` 中 `kernel:route:*` 耗时 — 若预测错误导致预装浪费

**建议**：保持现状，1 个月后根据 telemetry 数据决定是否简化为「最近 N 次频率」朴素模型。

---

### 6.2 [O2] 三级降级策略 — 当前 4 个参数是否过重

**现状**：`MAX_AUTO_RETRIES=1`, `MAX_MICRO_RETRIES=3`, 退避基数 500ms, jitter 200ms。

**建议**：
- 当前参数数量（4 个常量）在生产代码中不暴露，不影响外部 API
- 如需简化：合并为 `autoRetryCount` + `maxRetryCount` 两个参数，jitter 系数固定 0.25
- 退避统一为 `base * 2^n + base * jitter * Math.random()` 标准实现

**当前状态**：参数可控，不过度。

---

### 6.3 [O3] Canary 灰度分流 — 复杂度高

**现状**：CanaryManager 已实现 FNV-1a 分流 / 远程配置拉取 / 自动刷新 / 白名单强制命中 / 内核版本兼容性检查。完整但复杂。

**建议**：
- 若发版频率 < 1 次 / 周 → 仅保留「白名单 + 显式 tag 开关」简化版
- 若需高频 A/B 实验 → 当前实现合理
- 建议增加 `CanaryManager.init({ mode: 'simple' | 'advanced' })` 两档

**预估工期**：1d（按需）

---

### 6.4 [O4] Speculation Rules API — 双预定问题

**现状**：`applyPrefetchBoost` 仅在 `prefetchStrategy: 'eager'` 时注入 Speculation Rules，且 `start()` 后的 idle 预加载路径与之可能「双预定」。

**建议**：
1. 保留但维持默认关闭（当前行为）
2. Speculation Rules 注入前检查 `loadApp` 是否已将目标 URL 加载到缓存，是则跳过
3. 长期观测 Chromium 市占率（当前 ~70%+）

---

## 七、类型与工程质量

### 7.1 类型沉淀

`iframe-sandbox.ts` 第 529、413 行仍有 `as any` 断言；`sandbox-strategy.ts` 第 181 行 `handlers: Record<string, (...args: any[]) => unknown>` 使用 `any`。

**建议**：完善 `noImplicitAny` 配置覆盖，CI 中 `pnpm typecheck` 零 warning。

**预估工期**：0.5d

### 7.2 Bundle Size 监控

微前端运行时本身应轻量化。建议在 CI 中增加：

```json
{
  "scripts": {
    "size": "bundlesize -f 'dist/index.mjs' -s '50kB'"
  }
}
```

当前源文件总计 ~7000 行，预估 gzip 后 ~35-45kB，仍在合理区间。

### 7.3 测试覆盖率目标

当前测试文件 9 个 + contract spec 1 个，覆盖：
- ✅ kernel.test.ts (463 行)
- ⚠️ scheduler.test.ts (146 行) — 覆盖基础，但 `evictKeepAliveIfNeeded` LRU 顺序 / pin 保护 / TTL 过期未充分覆盖
- ✅ sandbox.test.ts (168 行)
- ⚠️ loader.test.ts (84 行) — 缺少 error 路径覆盖
- ✅ error-boundary.test.ts (58 行)
- ✅ version-manager.test.ts (195 行)

**缺口**：
- ❌ `swap-strategy.ts` 适配器测试
- ❌ `ManagerRegistry` 独立测试
- ❌ `createKernel` 闭包隔离度 HMR 模拟测试
- ❌ `switchToApp` 令牌并发竞态测试（快速连续路由切换）
- ❌ `evictKeepAliveIfNeeded` 的 LRU 排序 / pin 保护 / TTL 过期边界

---

## 八、优先级排序汇总

| 优先级 | 维度 | 建议 | 预估工期 | 说明 |
|--------|------|------|----------|------|
| **P0** | 架构 | sandbox-strategy 接口闭环使用 | 2.5d | 当前并行实现是最大架构债 |
| **P1** | 架构 | 裸单例纳入 ManagerRegistry | 1.5d | 彻底消除 HMR 状态串扰风险 |
| **P1** | 体验 | 异常路径 KernelError 落地 | 0.5d | Sentry 聚合报警准确性 |
| **P1** | 质量 | ManagerRegistry + 闭包隔离自动化测试 | 1.5d | 防范增量代码破坏隔离 |
| **P2** | 架构 | kernel.ts 职责二次拆分（~200 行） | 2d | 从 871 行缩减至 ~300 行 |
| **P2** | 功能 | iframe bridge 统一消息通道 | 1.5d | 对齐 qiankun/micro-app 体验 |
| **P2** | 功能 | updateAllApps 批量广播 | 0.5d | 主题/租户切换一键通知 |
| **P2** | 架构 | micro-runtime semver 下沉 | 0.5d | 依赖方向规整 |
| **P2** | 体验 | DevTools 面板 Tab 分页 | 1d | 子应用数 > 8 时必做 |
| **P3** | 功能 | addApp 运行时懒注册 | 0.5d | 对齐 qiankun registerMicroApps |
| **P3** | 体验 | 预加载 hover 视觉反馈 | 0.5d | 轻微提升 |
| **O3** | 架构 | Canary mode simple/advanced 两档 | 1d | 按需投入 |

**建议排序实施**：

```
Sprint N:   P0(2.5d) + P1 异常路径(0.5d)                    ≈ 3d
Sprint N+1: P1 裸单例收归(1.5d) + P1 测试补齐(1.5d)         ≈ 3d
Sprint N+2: P2 kernel拆分(2d) + P2 iframe bridge(1.5d)     ≈ 3.5d
```

---

## 九、对标竞品能力矩阵（最新状态）

| 能力 | micro-kernel (当前 v4.0.1) | qiankun 2.x | wujie 1.x | micro-app 1.x | Garfish 1.x |
|------|---------------------------|-------------|-----------|---------------|-------------|
| 沙箱类型 | 3 种（含策略接口） | snapshot/proxy/legacy | iframe + webcomponent | webcomponent + iframe | snapshot/proxy |
| keep-alive | LRU + TTL + Pin | 无原生 | 有 | 有（rerender） | 有 |
| 路由预测 | 马尔可夫链 + 冷启动 fallback | 无 | 无 | 无 | 无 |
| 灰度分流 | 有（自研，Canary） | 无 | 无 | 有限 | 有 |
| 通信 | pub-sub + req-res + bridge | props + globalState | props + bus | 数据属性 | props + bus |
| 预加载 | 多策略 + Speculation Rules | prefetch | 按需 | 预加载 | prefetch |
| 跨域子应用 | 不支持 | 支持 | 支持 | iframe 模式 | 支持 |
| 错误分类 | 9 种 errorCode | 无 | 无 | 无 | 有限 |
|  DevTools | 有面板 + Chrome Ext bridge | 无 | 无 | 有限 | 有 |

**差异化优势**：
1. 马尔可夫链路由预测 + 预加载命中率可观测（业界独有）
2. 错误分类 9 种 errorCode — Sentry 精确聚合
3. Canary 灰度带 FNV-1a + 自动刷新
4. iframe 沙箱内置 globalState 跨 realm 桥 + RPC

---

## 十、总结

micro-kernel 当前 v4.0.1 在**能力覆盖度与差异化创新**上已超越主流开源框架（路由预测、错误分类、灰度分流三处独有）。针对 **v4.0 架构文档中提出的优化建议**，约 60%+ 已在本版本落地（ManagerRegistry / 闭包状态收归 / 预加载统计 / 冷启动 fallback / 错误码等）。

**本轮最关键的架构债**是 sandbox-strategy 接口在 Scheduler 中的并行实现，建议优先闭环。其次是剩余 7+ 个模块的裸单例仍未纳入 ManagerRegistry，HMR 场景下存在理论状态串扰风险。

按 P0 → P1 → P2 节奏推进，预计 2 个 Sprint（~6.5d）可完成核心架构优化与质量补齐。

---

*分析日期：2026-08-05*
*分析范围：`comm/effects/micro-kernel/` 全部 22 个源文件 + `src/__tests__/` 9 个测试文件*
*文档版本：v4.0.1-review*
