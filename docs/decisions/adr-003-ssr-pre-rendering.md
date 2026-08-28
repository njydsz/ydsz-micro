# ADR-003: SSR / 预渲染方案评估

- **状态**: 已评估，暂不实施
- **关联代码**: `main/`、`conf/vite-config/src/config/application.ts`

## 背景

中后台首屏（登录 + 主应用壳）以 JS 渲染，FCP/LCP 依赖 JS 下载与执行。评估是否引入 SSR / 预渲染改善首屏。

## 评估结论

| 方案 | 收益 | 成本 | 结论 |
| ---- | ---- | ---- | ---- |
| Nuxt / Vite SSR | 首屏 HTML 直出、SEO | 微前端 ESM 直引与 SSR 水合冲突大；8 子应用需全量改造；服务端运维成本 | ❌ 不采纳 |
| 预渲染（vite-plugin-prerender） | 登录页/壳层静态直出 | 需维护渲染快照与构建耦合 | ⏸ 暂缓 |
| 骨架屏 + 预加载 | 用户感知首屏时间显著下降 | 已落地 | ✅ 采纳 |

## 已采纳的替代路径（以代码事实为准）

1. **路由级骨架屏**（v3.3）：子应用 manifest.routes 声明骨架屏类型，主应用容器在 ESM 加载阶段即渲染（`micro-kernel/src/loader.ts` ManifestRoute）
2. **四策略预加载**（hover/idle/route/frequency）+ Speculation Rules 预取增强（`kernel-startup.ts` applyPrefetchBoost）
3. **injectAppLoading**：主应用构建期注入 loading（`conf/vite-config` 插件集）

## 触发重评的条件

- 出现面向公网/SEO 的页面需求
- 预加载命中率周报（preload-metrics）显示弱网场景首屏体验仍不达标
