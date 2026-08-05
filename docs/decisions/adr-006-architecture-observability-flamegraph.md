# ADR-006: 架构可观测性火焰图

## 状态

已接受 (Accepted) — 2026-08-05

## 背景

当前项目已有完善的监控体系（Sentry 错误监控 + Web Vitals 性能采集），但缺少**应用内部运行时性能的可视化**能力：

1. **子应用加载耗时分布不透明**：只知道总耗时，不知道加载各阶段（fetch → parse → mount → render）的时间分布
2. **runtime 事件难以追踪**：globalState 变化、消息通信、keep-alive 切换的耗时
3. **缺少长任务分析**：哪些函数调用阻塞了主线程
4. **DevTools Panel（Chrome Extension）已有基础**，可扩展为专业的性能分析面板

## 决策

实施 **「Performance API 标记 + 火焰图可视化 + 内存趋势监控」** 三层可观测性方案。

### 层级一：运行时性能标记（已有基础）

已在 `micro-kernel` 中使用 `performance.mark` / `measure`，需系统化扩展：

| 阶段 | 标记名 | 说明 |
|------|--------|------|
| 子应用加载 | `kernel:load:{appName}` | fetch + parse + eval |
| 子应用挂载 | `kernel:mount:{appName}` | mount 生命周期 |
| 子应用卸载 | `kernel:unmount:{appName}` | unmount 生命周期 |
| 子应用激活 | `kernel:activate:{appName}` | keep-alive 恢复 |
| 子应用停用 | `kernel:deactivate:{appName}` | keep-alive 冻结 |
| 预加载触发 | `kernel:preload:{appName}` | 预测预加载 |
| 消息通信 | `kernel:message:{type}` | 子应用间消息 |
| 全局状态变化 | `kernel:state:{key}` | globalState patch |
| 路由跳转 | `kernel:route:{to}` | 路由切换 |

### 层级二：火焰图组件

在现有 Chrome Extension DevTools Panel 中集成火焰图：

**面板结构**：

```
+-------------------------------------------+
|  REMI DevTools                            |
+-------------------------------------------+
| [Overview] [Timeline] [Memory] [Network]  |
+-------------------------------------------+
|  Flame Chart                              |
|  ┌─────────────────────────────────────┐ |
|  │ kernel:load userinfo-web     ████████│ |
|  │   ├─ fetch entry            ██      │ |
|  │   ├─ import module          ██████  │ |
|  │   └─ mount                  ██      │ |
|  │ kernel:mount agent-web     ████████  │ |
|  │   ├─ mount                  ████    │ |
|  │   └─ first-render           ████    │ |
|  └─────────────────────────────────────┘ |
+-------------------------------------------+
```

**实现要点**：

```typescript
// 火焰图数据结构
interface FlameNode {
  name: string;
  startTime: number;
  duration: number;
  children: FlameNode[];
  color: string;  // 按阶段着色：load=蓝, mount=绿, state=橙, message=紫
}

// 从 Performance API 读取标记
function collectFlameData(): FlameNode[] {
  const marks = performance.getEntriesByType('mark');
  const measures = performance.getEntriesByType('measure');

  // 将 marks/measures 转换为树结构
  // 按 startTime 排序并构建父子关系
  return buildFlameTree(marks, measures);
}
```

**渲染方案**：
1. Canvas 2D：实现简单，适合静态火焰图展示
2. WebGL：大数据量时性能更好，但实现复杂
3. 推荐：先使用 Canvas 2D，数据量超过 1000 帧时考虑 WebGL

### 层级三：内存趋势监控

在 DevTools Panel 中展示内存使用趋势：

- 堆内存使用量（JS Heap）
- DOM 节点数
- 事件监听器数量
- keep-alive 实例数（重要！微前端常见问题）

```typescript
interface MemorySample {
  timestamp: number;
  jsHeapSize: number;      // MB
  domNodes: number;
  listeners: number;
  keepAliveInstances: number;
}
```

### 层级四：子应用通信拓扑

可视化子应用间的消息流向：

```
[userinfo-web] ----setGlobalState----> [main]
     |                                      |
     +--- navigate ---> [system-web] <-----+
```

## 实施计划

### Phase 1: 运行时标记补全（2 天）

- [ ] 审计现有 `performance.mark/measure` 确保标记完整
- [ ] 补充 globalState、消息通信、路由跳转的标记
- [ ] 增加标记开关（生产环境默认关闭，可通过 `?debug_perf=1` 开启）

### Phase 2: DevTools 火焰图集成（3 天）

- [ ] 在 Chrome Extension devtools/panel.js 中集成火焰图组件
- [ ] 实现 collectFlameData() 采集函数
- [ ] 实现火焰图 Canvas 渲染
- [ ] 添加悬停提示（显示耗时、阶段名）

### Phase 3: 内存监控面板（2 天）

- [ ] 定时采样 `performance.memory`（仅 Chrome 支持）
- [ ] 采样 keep-alive 实例数量（从 scheduler.ts 暴露接口）
- [ ] 在 Panel 中展示内存趋势折线图

### Phase 4: 通信拓扑可视化（3 天）

- [ ] 在 message-broker.ts 中记录消息日志（可开关）
- [ ] 实现消息流向图渲染（简化版 DAG）
- [ ] 支持按时间筛选、按应用筛选

## 关键代码路径

| 文件 | 用途 |
|------|------|
| `comm/effects/monitor/src/performance-tracker.ts` | 新增：运行时标记采集与存储 |
| `chrome/devtools/panel.js` | 修改：集成火焰图与内存面板 |
| `comm/effects/monitor/src/devtools-bridge.ts` | 修改：扩展消息协议 |
| `comm/effects/micro-kernel/src/scheduler.ts` | 修改：补全 mount/unmount 标记 |
| `comm/effects/micro-kernel/src/message-broker.ts` | 修改：增加消息日志 |

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| `performance.memory` 仅 Chrome 支持 | Firefox/Safari 显示 NOT_SUPPORTED 提示 |
| 生产环境开启标记影响性能 | 默认关闭，通过 URL 参数/debug 开关显式启用 |
| Canvas 火焰图大数据量卡顿 | 实现帧聚合（相邻 < 1ms 的合并） |
| DevTools Panel 数据安全 | 生产环境 DevTools Panel 默认关闭（已有机制） |

## 参考

- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/evaluate-performance/)
- [火焰图详解](https://www.brendangregg.com/flamegraphs.html)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- ADR-001: 微前端架构选型
- ADR-003: SSR 预渲染决策
