# micro-kernel 全面分析与优化建议

> 分析基线：`comm/effects/micro-kernel` 当前代码（约 14.7k 行 / 65 模块），含配套 micro-runtime、vite-plugin-manifest、conf/vite-config 共享构建链、Chrome DevTools 扩展与宿主 main-web 集成层。
> 对标对象：qiankun 3（已停滞）、wujie（腾讯）、micro-app（京东）、Garfish（字节）、single-spa、Module Federation 2.0（2026-04 稳定，@module-federation/enhanced + Rspack 生态），以及互联网大厂前端研发规范（类型门禁、测试策略、可观测性、契约驱动）。
> 日期：2026-09-01

---

## 一、执行摘要

**总体判断：micro-kernel 的核心链路（ESM manifest 加载 → 生命周期 → 沙箱 → keep-alive → 降级 → 通信）已达到甚至部分超过 qiankun/wujie/micro-app 的能力水准，工程完成度在同类自研方案中属于第一梯队。当前最大的风险不在"功能不够"，而在三处：①质量保障体系被规范掏空（测试禁令 + type-check 空转）；②分层抽象名不副实（micro-runtime 穿透、双入口工厂并存）；③部分模块存在明显的过度设计（iframe 沙箱、三套状态恢复机制），维护成本正在超过收益。**

| 维度 | 现状评分 | 核心结论 |
| ---- | ---- | ---- |
| 架构 | ★★★★☆ | 核心链路优秀；runtime 抽象层与注册表归属需收敛 |
| 功能 | ★★★★☆ | 对 qiankun 全面领先，对 MF2.0 尚缺类型共享与多实例激活 |
| 性能 | ★★★☆☆ | 机制丰富但回环未闭环（SW 缓存未落地、strictIntegrity 双请求） |
| 体验 | ★★★★☆ | 骨架屏/降级 UI/DevTools 完备；CSS 时序与失败可观测有短板 |
| 简洁度 | ★★☆☆☆ | 过度设计明显，约 1.5k~2k 行代码属"无真实接入方"维护负担 |
| 质量保障 | ★★☆☆☆ | 测试被禁、type-check 0 任务、importmap 版本锁从未执行 |

---

## 二、对标基线速览（2026 年格局）

- **qiankun**：npm 停在 3.0.0-rc.19 近两年无更新，官方文档失修，社区已不推荐新项目选型。micro-kernel 的 ESM 直引 + importmap 方案在 Vite 兼容性上天然优于 qiankun（后者需 vite-plugin-qiankun 补丁）。**此项对标已胜出，无需追加投入。**
- **wujie / micro-app**：仍在活跃维护，核心优势是 iframe/WebComponent 级隔离与子应用保活。micro-kernel 的 keep-alive（LRU/TTL/内存压力/serialize-hydrate）已覆盖保活场景，且 avoid 了 iframe 的通信/性能代价；对同源同团队集群，隔离弱于 iframe 是**合理取舍**而非缺陷。
- **Module Federation 2.0（新标杆）**：2026-04 稳定。三个值得吸收的能力：①跨远程的 **TS 类型共享**（dts 自动生成/热更）；②**manifest 驱动的动态发现 + 预加载**（与 micro-kernel manifest 思路同源，可互相印证）；③**运行时插件系统**（fetch 拦截、errorLoadRemote 降级、熔断）。MF2 生态（Rspack 构建 5-10 倍提速）是构建时组合路线，与 micro-kernel 的运行时组合路线并不冲突，但其工程实践值得移植。
- **大厂研发规范共识**：基础设施包（沙箱/调度器/预测器）必须有单测兜底；类型门禁必须真实运行；共享依赖版本锁必须在 CI 强制执行。**这三条恰是当前仓库的三个空洞。**

---

## 三、现状盘点：值得肯定的设计（保持，不要动）

1. **ESM 原生加载链**（`loader.ts`）：无 HTML 解析、无 UMD、无 eval；manifest LRU 缓存（上限 50）；SRI 完整性（CSS link 级 + JS strictIntegrity 模式）；CSP nonce 兼容；指数退避 + jitter 重试。链路干净，比 qiankun import-html-entry 更现代。
2. **并发安全切换**（`kernel-lifecycle.ts`）：switchToken 令牌校验 + AbortController 中止，双保险解决"后到卸载先到挂载"竞态，注释与实现质量高。
3. **快照沙箱的诚实边界**（`sandbox.ts`）：明确声明"不防恶意代码，仅防意外污染"；v4.3.1 修复（document 监听代理、rAF 分池清理、按 target 路由移除）显示团队对沙箱泄漏模式有真实理解。
4. **资源调度**（`task-queue.ts`）：自适应保活上限（堆占用 >70%/>90% 分级）、`performance.measureMemory()` 标准优先 + 废弃 API 回退 + 非 Chromium 计数降级，三条路径全覆盖；before-evict 可取消事件设计良好。
5. **可观测性**：kernel:mount/route/state 性能标记、preload-metrics 命中率回环（sendBeacon）、DevTools MV3 扩展三层消息链。对标 ADR-006 蓝图基本成型。
6. **代码注释纪律**：P0-A2/v4.x 编号溯源 + 修复原因记录（如 v3.1 沙箱栈修复、v4.3.1 rAF 分池），是仓库最有价值的隐性资产。

---

## 四、架构优化建议

### A1【P0】收敛 micro-runtime 抽象层——"要么真边界，要么删掉"
**现状**：`MicroRuntime` 接口按 micro-kernel 能力集定制（30+ 方法，注释自认 qiankun 无法满足）；宿主 `main/src/setup/micro-runtime.ts` 直接 import `createKernel/setStaticRegistry/getPreloadManager` 等 kernel 符号；`loader.ts`（kernel 包）反向 import micro-runtime 类型，包依赖互相缠绕。
**建议**（二选一，推荐前者）：
- **方案 A（轻收敛，1~2 天）**：删掉"可换内核"叙事，micro-runtime 降级为**类型契约包 + 宿主装配层**，kernel 不再 import micro-runtime（类型移到独立 types 包或就地定义）；README/ADR 表述改为"micro-runtime 为 micro-kernel 的门面（Facade），不支持换内核"。
- **方案 B（真抽象，1~2 周，不推荐）**：把 MicroRuntime 收窄为 10 个核心方法（register/start/unmount/navigateTo/sendToApp/…），宿主只经接口访问，其余能力走 kernel 扩展通道。除非有接入第二内核的真实诉求，否则是负 ROI。

### A2【P0】合并双入口工厂，消除误用陷阱
**现状**：`micro-runtime/defineSubApp`（mount/unmount 空壳实现，源码注释承认"实际未使用"）与 `shared-auth/createSubApp`（8 个子应用实际使用）并存，职责重叠。
**建议**：将 `defineSubApp` 标记 `@deprecated` 并指向 `createSubApp`，一个版本周期后删除；或反过来把 `createSubApp` 迁回 micro-runtime 作为唯一入口（顺带修复 shared-auth 承担了不属于认证职责的入口工厂问题）。**这是低成本高收益的清理。**

### A3【P0】注册表迁出构建配置包
**现状**：`MICRO_APPS` 定义在 `conf/vite-config/src/micro-apps.config.ts`，被 main 运行时 import（构建配置包进入运行时依赖图）；`MicroAppEntry` 类型在 vite-config 与 micro-runtime 重复定义。
**建议**：注册表单一事实源移到 `main/src/config/micro-apps.ts`（或 `comm/constants`），vite-config 通过反向注入/构建脚本消费；类型只保留 micro-runtime 一份。消除"构建包被运行时依赖"的分层倒置，vsh check-arch 可加规则防回归。

### A4【P1】模块级单例统一收编
**现状**：`getPreloadManager/getVersionManager/getCanaryManager/getRoutePredictor` 与 scheduler context 均为模块级单例 + 手写 reset（`resetPreloadManager/resetScheduler/...` 共 10+ 个 reset 函数）；ManagerRegistry 已有 DisposableManager 机制但覆盖不全。
**建议**：所有单例统一经 `createManagerRegistry` 注册与 dispose；reset 函数收敛为 `kernel._stop()` 唯一入口。消除 HMR/多实例场景下"漏 reset 一个就状态残留"的隐患（v4.0.1 评审报告已自述 7+ 模块未收编，属已知债）。

### A5【P1】文档与实现同步（文档债）
**现状**：README 引用的 `docs/decisions/` 全部 ADR 与 `docs/v4.0-优化设施说明.md` 已被删除（git 历史可查），链接 404；ADR-001/005 描述的测试验收路径已被规范 §15.10 推翻但未修订；README Node ≥ 20.10 与 vsh 实际要求 Node ≥ 22.6 矛盾；规范示例错误码 `10000` 与实际 `A00000` 漂移。
**建议**：从 git 历史恢复 ADR-001/002/005/006/007 至 docs/decisions/，逐份修订与现状冲突的段落；README 环境要求改为 Node ≥ 22.6。**ADR 是决策资产，删除比过时更糟。**

---

## 五、功能增强建议

### F1【P0】把质量门禁从"纸面"变"真实"（最高优先级）
这是与竞品/大厂规范差距最大的一项，且**不违反 §15.10 的字面约束**：
- **type-check 接线**：README 自述 `pnpm type-check` 当前执行 0 任务。逐包把 `type-check` 脚本接入 turbo（先 `@ydsz/micro-kernel`、`@ydsz-shared-auth`、micro-runtime 三个基础设施包，再业务包），存量错误清零一个接一个。
- **importmap 版本锁执行**：`sync:shared-deps` 机制已落地但"从未首次执行"。立即执行一次并提交 `bash/importmap.lock.json`，把 `sync:shared-deps:check` 加入 CI 必跑——否则共享依赖版本漂移会导致主子应用双实例（Vue 双实例 = 全局插件/Provide 失效，是微前端最难排查的故障类别）。
- **cspell / format 脚本补齐**：README 中两处"—（待接入）"直接补上，半小时工作量。

### F2【P1】测试策略：为基础设施包争取"仓库外"豁免
**现状**：§15.10 禁止一切测试代码。但 micro-kernel 恰是错误成本最高的模块（沙箱泄漏、LRU 淘汰、马尔可夫预测、并发切换——每处 bug 影响全部 8 个子应用）。qiankun/wujie/MF2 均有完整测试套件，这也是它们能被社区信任的前提。
**建议**（不违反规范的前提下）：
1. 向规范所有方申请修订：§15.10 增加例外条款——"基础设施包（micro-kernel/micro-runtime/shared-auth）允许在独立目录/独立仓库维护测试"；实践中可把测试放在 `bash/` 之外的**独立仓库**（如 `ydsz-micro-kernel-tests`），以 devDependency 方式引用源码，主仓保持零测试文件。
2. 若规范不可动摇：至少保留**契约测试的静态形态**——为 sandbox exit 清理矩阵、LRU 淘汰序、降级决策表写"断言型文档"（表驱动 .ts 数据文件 + vsh 校验脚本），用静态门禁逼近测试覆盖。
3. 长期：如果没有测试兜底，micro-kernel 的迭代速度会被迫放缓（每次改动全靠人工回归），这本身就是架构债的复利。

### F3【P1】吸收 MF2 的类型共享思路（低成本版）
**现状**：主子应用类型契约靠 monorepo workspace 包（同步编译时有效）；但灰度（canary）场景下，运行时加载的可能是**旧版本子应用**，其 props 契约可能与宿主新代码不匹配——目前仅靠 bootstrap 阶段 semver 断言兜底。
**建议**：在 `vite-plugin-manifest` 的 manifest.json 中加入 `propsContract`（导出的 mount props 类型哈希或最小 JSON Schema），kernel 在 activate 前做浅校验，不匹配时走既有的分级降级 UI。一个下午可落地，补上灰度场景的类型漂移盲区。

### F4【P2】多实例同时激活（对标 wujie/micro-app 的差异化短板）
**现状**：单 `activeAppName` + keep-alive，同一时刻仅一个子应用挂载在主容器；无法把子应用作为**微组件**嵌入另一个页面区域。
**建议**：暂不做通用微组件化（成本高、诉求弱）；但可支持"双容器激活"——`MicroAppConfig.container` 已是 per-app 配置，只需让 `switchToApp` 支持指定容器而非全局单容器切换，即可满足"侧边栏常驻 agent-web 助手 + 主区业务子应用"这类真实场景。改造集中在 kernel-router + lifecycle，约 2~3 天。

### F5【P2】运行时插件钩子（对标 MF2 Runtime Plugins）
**现状**：生命周期钩子（beforeLoad/afterMount/…）+ errorLoad 降级已覆盖 80% 场景，但 fetch 层不可插（strictIntegrity 的验签 fetch、manifest fetch 均为硬编码）。
**建议**：在 `LoadOptions` 增加 `fetcher?: (url) => Promise<Response>`（其实 `registerAppsAsync` 已有 fetcher 先例），供灰度平台/安全网关注入带签名的 fetch。低成本开放点。

---

## 六、性能提升建议

### P1【P1】CSS 注入时序：消除样式闪变（FOUC）
**现状**：`injectStylesheets` 同步 append `<link>` 后立刻 dynamic import + mount；CSS 加载与模块加载并行，**mount 渲染时 CSS 可能未就绪** → 子应用首帧无样式。
**建议**：改为 `await Promise.all(cssLinks.map(loadEvent))`（onload/onerror，超时兜底 3s），或直接用 `document.adoptedStyleSheets` + CSSStyleSheet 构造（免 reflow、可整体移除，Chrome 85+/Safari 16.4+ 已可用）。同时天然解决"卸载时 querySelectorAll 全文档扫描"（`removeStylesheets` 遍历 head）。

### P2【P1】strictIntegrity 双请求优化
**现状**：开启 strictIntegrity 时先 `fetch(entry)` 验签再 `import(entry)`，同一 URL 两次网络往返（命中 HTTP 缓存可接受，但首次加载/缓存失效时翻倍）。
**建议**：验签失败才阻断、成功则放行 import 的当前逻辑保留；补充：把验签 fetch 显式带 `cache: 'force-cache'`，并在响应头带强缓存时跳过二次下载；中期由 Service Worker 拦截 import 请求做流式验签（SW 方案已在 Roadmap，是正解）。

### P3【P1】Service Worker 缓存落地（v4.0 遗留 TODO）
**现状**：v4.0 文档自述"需安装 vite-plugin-pwa"未执行；当前子应用资源全靠 HTTP 缓存 + importmap vendor 磁盘缓存。
**建议**：落地一个极薄的 SW（不做 PWA 离线，只做子应用 chunk 的 CacheFirst + 版本化清理）：manifest.json 的 `integrity.js` 清单现成可用作缓存键与验签依据，kill two birds——离线能力 + 全量 chunk 验签（当前只验 entry）。注意 SW 作用域与灰度版本清理策略（canary 双版本并存时按 manifest.version 分桶缓存）。

### P4【P2】快照沙箱的 enter/exit 开销
**现状**：`enterSandbox` 全量 `Object.keys(window)` + 逐键值快照，`exitSandbox` 再全量 diff。window 键数百量级，每次激活/卸载两次 O(n) 扫描 + Map 写放大；低端移动设备上可感知。
**建议**：维护**全量键集合的惰性缓存**（首个沙箱 enter 时建立 `keySet`，此后只 diff 增量——proxy 阶段所有新增键已被 addEventListener/定时器代理之外的全局写遗漏，故快照仍需，但可用 `Proxy(window)` 只在代理期间记录"被写过的键"来把 exit 的恢复集合从全量键缩到 touched keys）。保守估计激活路径可减 50%+ 沙箱开销。若短期不做，至少在 health-check 的 loadDuration 指标旁增加 `sandbox:enter/exit` mark，用数据决策。

### P5【P2】es-module-shims 按需加载
**现状**：importmap 垫片全量注入。2026 年常青浏览器（Chrome 89+/Edge/Firefox 108+/Safari 16.4+）已原生支持 importmap，README 声称支持 Chrome 80+ 与垫片存在矛盾。
**建议**：`<script type="importmap">` + 特性检测（`HTMLScriptElement.supports('importmap')`）仅在不支持时动态注入 shims；主流用户省一个第三方脚本请求与垫片轮询开销。

### P6【P3】预加载去重与合并
**现状**：modulepreload 注入（link-hints）、Speculation Rules、PreloadManager 四策略、hover-feedback——四套机制并存，同一子应用可能被多个机制重复预取（`preloadCache` 只在 PreloadManager 内部去重）。
**建议**：以 PreloadManager 为唯一调度入口，其余机制降级为"提示提供者"（向 manager 报告意图，由 manager 统一决策 + 去重 + 优先级）；配合已建成的 preload-metrics 命中率数据，砍掉命中率低的策略配置。

---

## 七、体验改善建议

### E1【P1】失败可观测性对用户侧补全
- manifest fetch 失败/验签失败目前对用户表现为骨架屏 + 降级 UI，但**降级 UI 文案未区分"网络失败/版本损坏/服务下线"**（KernelErrorCode 有 7+ 分类，error-boundary 渲染层未细分）。建议 fallback 组件透出 error code 分组文案，并附"复制诊断信息"按钮（含 manifest version、kernel 版本、traceId）——客户报障时一线支持可自助定位。
- 预加载 hover 反馈已有；补充**降级重试倒计时**的 hover 提示（auto-retry 静默期间用户不知道发生了什么）。

### E2【P2】跨子应用会话恢复
- `page-cache-manager`（滚动位置 + localStorage 持久化）与 keep-alive serialize/hydrate 已强；但**刷新浏览器后 keep-alive 缓存丢失**，用户回到列表页需重新走一遍查询。建议：beforeunload 时把 activeApp 路由 + 页面缓存（已有 persistPageCache）打包写入 sessionStorage，启动时 restore 到"上次退出位置"，形成完整的会话连续性故事。

### E3【P2】键盘可达性与焦点管理
- 子应用切换时焦点残留（被卸载 DOM 中的焦点元素消失后焦点丢到 body）。建议 deactivate 后将焦点还原到触发切换的菜单项（A11y 基线 ADR-005 的自然延伸，改 SubAppContainer/侧边菜单各一处）。

---

## 八、过度设计裁剪建议（做减法）

这是当前**最值得投入的方向之一**：以下模块维护成本已超过收益，建议冻结或移除。

| 模块 | 行数（估） | 判断 | 建议 |
| ---- | ---- | ---- | ---- |
| iframe 沙箱全家桶（iframe-sandbox/iframe-rpc/iframe-bridge/iframe-types） | ~900 | ADR-007 自认 experimental、"以有真实接入方为前提"，无任何子应用使用 iframe 模式 | **冻结**：从主流程与默认构建中摘除（保留源码与类型导出，标 @experimental），不再投入新特性；下一个大版本移除或抽为可选子包 |
| `defineSubApp` 空壳入口 | ~200 | 注释自认未使用，与 createSubApp 重叠 | **移除**（见 A2） |
| 三套状态恢复机制（keepAlive cachedRoot + serialize/hydrate + page-cache-manager） | ~800 | 职责交叠：三者都在做"回到子应用时恢复状态" | **收敛**：明确分层——serialize/hydrate 管内存态（组件状态），page-cache 只管滚动与持久化；砍掉 page-cache-manager 中与 hydrate 重复的"编程式状态存取"（saveAppState/loadAppState/removeAppState 三个 API），文档写清选型规则 |
| css-containment + runtime-css-scope + ESLint 约束 | ~400 | 三层 CSS 隔离机制并存 | **收敛**：同源同团队场景，Shadow DOM 都不需要；保留 runtime-css-scope（兜底）+ ESLint（约定）即可，css-containment 若无实测收益数据（DevTools 有性能标记，可查）则冻结 |
| 马尔可夫路由预测 | ~700 | 有 minSampleSize 与命中率回环，属"可辩护的复杂度"；但 8 个子应用的转移矩阵稀疏 | **观察**：先看 preload-metrics 的 hitRate 数据（机制已建成，不追加投资；hitRate < 简单 frequency 策略则降级为 frequency + 最近访问） |
| 独立的 canary-hash（FNV-1a）+ 组织白名单 + 标签路由 | ~600 | 对标竞品灰度能力合理，但当前 8 个同仓子应用、统一发布 | **保留但简化配置面**：默认路径 userId 哈希已够，白名单/标签路由等配置项若无真实使用方，下一版移除（配置复杂度也是债务） |

**裁剪总量约 1.5k~2k 行 + 大量"隐性 API 面"（index.ts 已导出 100+ 符号）。建议给 index.ts 做一次导出面审计：公开 API 应收敛到 50 个以内，其余转内部。**

---

## 九、落地路线图

### 第一阶段（1~2 周，堵风险）
1. type-check 逐包接线（基础设施包优先）并清零存量错误 → CI 变红才可信
2. 首次执行 `sync:shared-deps` 并提交 importmap.lock.json，`check` 进 CI 必跑
3. CSS 注入时序修复（FOUC）+ strictIntegrity force-cache（P1/P2）
4. A2 双入口合并 + A3 注册表迁移（小改动大收益）
5. 恢复并修订 ADR 文档、README 环境要求/失效链接
6. cspell / format 脚本补齐

### 第二阶段（3~4 周，提能力）
1. A1 micro-runtime 收敛 + A4 单例收编 ManagerRegistry
2. SW 缓存落地（chunk 级 CacheFirst + integrity.js 全量验签 + 灰度分桶）
3. F3 manifest propsContract 灰度类型校验
4. E1 降级 UI 错误分类 + 诊断信息复制
5. F2 测试豁免谈判（或独立测试仓方案）
6. F4 双容器激活（如 agent-web 常驻侧栏是真实诉求）

### 第三阶段（1~2 月，做减法 + 数据驱动）
1. 第八节裁剪清单执行（iframe 全家桶冻结、状态恢复机制收敛、导出面审计）
2. preload-metrics 数据复盘：砍低命中策略、验证/降级马尔可夫预测
3. 快照沙箱 enter/exit 增量优化（以 P4 指标数据为决策依据）
4. es-module-shims 特性检测按需加载

---

## 十、风险与前提

- **§15.10 测试禁令是最大的系统性风险**：所有运行时模块（沙箱/调度/预测/通信）的每次改动都缺乏回归保障。若无法豁免，建议至少为 micro-kernel 建立独立测试仓（合规且有效）。
- **监控端点未部署**（ADR-006）：preload-metrics / Web Vitals 目前仅进 DevTools 与控制台，第二、三阶段的数据驱动决策依赖端点上线，需与网关团队排期。
- **灰度与 keep-alive 交互**：canary 切换版本时，keep-alive 缓存的旧版本实例如何失效当前未显式处理（versionManager 轮询发现新版本后，缓存的 cachedRoot 仍是旧版 DOM）。建议 in versionManager 发现更新时主动 evict 该 app 的 keep-alive 缓存。
- 规范本身存在编号错乱与错误码漂移（17 章内嵌 18.x、SUCCESS=10000 vs A00000），建议随 A5 文档修订一并反馈给规范所有方。

---

## 附：优先级速查表

| 编号 | 建议 | 维度 | 优先级 | 预估成本 |
| ---- | ---- | ---- | ---- | ---- |
| F1 | type-check 接线 + importmap 锁执行 + cspell/format | 质量 | P0 | 2~3 天 |
| A2 | 合并 defineSubApp/createSubApp | 架构 | P0 | 0.5 天 |
| A3 | 注册表迁出 vite-config | 架构 | P0 | 1 天 |
| P1 | CSS 注入时序（FOUC） | 性能/体验 | P1 | 1 天 |
| P2 | strictIntegrity force-cache | 性能 | P1 | 0.5 天 |
| A5 | 文档债清理（ADR 恢复修订） | 架构 | P1 | 1 天 |
| A1 | micro-runtime 收敛为 Facade | 架构 | P1 | 1~2 天 |
| A4 | 单例收编 ManagerRegistry | 架构 | P1 | 2~3 天 |
| P3 | Service Worker 缓存 + 全量验签 | 性能/安全 | P1 | 3~5 天 |
| F3 | manifest propsContract 灰度校验 | 功能 | P1 | 0.5 天 |
| F2 | 测试豁免/独立测试仓 | 质量 | P1 | 流程 |
| E1 | 降级 UI 错误分类 + 诊断复制 | 体验 | P1 | 1~2 天 |
| F4 | 双容器激活 | 功能 | P2 | 2~3 天 |
| E2 | 刷新后会话恢复 | 体验 | P2 | 2 天 |
| E3 | 焦点管理 | 体验 | P2 | 0.5 天 |
| P4 | 快照沙箱增量优化 | 性能 | P2 | 2~3 天 |
| P5 | es-module-shims 按需 | 性能 | P2 | 0.5 天 |
| §8 | 过度设计裁剪（iframe 冻结等） | 简洁度 | P2~P3 | 3~5 天 |
| P6 | 预加载机制去重 | 性能 | P3 | 2 天 |
| F5 | LoadOptions fetcher 插件点 | 功能 | P3 | 0.5 天 |
