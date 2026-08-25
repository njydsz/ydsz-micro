# ADR-003: SSR / Pre-rendering 方案评估

- **状态**：已采纳（Accepted）
- **日期**：2026-08（评估归档）
- **决策人**：ydsz-frontend-team

## 背景（Context）

中后台微前端底座需在「首屏性能」「SEO」「构建/部署复杂度」之间取舍。
部分对标竞品（如 JeecgBoot、RuoYi 的某些发行版）提供 SSR / 静态预渲染能力。
YDSZ Micro 当前为纯客户端渲染（CSR）的 Vue 3 SPA，主应用 `main-web` 与各子应用独立部署。

评估选项：

1. **全量 SSR**（Nuxt / Vite SSR）：服务端渲染 HTML，首屏直出。
2. **静态预渲染（Pre-rendering / SSG）**：构建期对固定路由生成静态 HTML。
3. **保持 CSR + micro-kernel 预取/预测**（现状增强）。

## 决策（Decision）

**不引入 SSR / 通用 Pre-rendering，维持 CSR 架构，并将性能投入集中在客户端预测与预加载设施。**

理由：

- 本平台为**内部中后台系统**，登录态鉴权前置，无外部 SEO 诉求，SSR 的核心收益（SEO、公开页首屏）不适用。
- 微前端子应用**独立构建、独立部署**于不同端口/域名，服务端聚合渲染需要统一的 Node 运行时与流式拼接，
  会显著抬升部署拓扑复杂度，与「最小依赖、绝对可控」的工程理念冲突。
- 客户端首屏体验已由 **路由马尔可夫预测**（`route-predictor.ts`）+ **六种预加载策略**（`preload-strategy.ts`）
  + **Speculation Rules 原生预取**（`speculation-rules.ts`）覆盖，见 [v4.0 优化设施说明](../v4.0-优化设施说明.md)。
- 鉴权拦截发生在路由守卫（`main/src/router`），CSR 下可统一处理，SSR 需额外处理服务端重定向与 Cookie 透传。

## 后果（Consequences）

- **正面**：部署拓扑简单，子应用自治，构建链保持纯静态产物，契合微前端独立发布模型。
- **负面**：公开可达页面（如有）无法获得 SSR 的首屏直出收益——当前产品形态无此诉求。
- **延伸**：若未来出现对外公开门户页，可对该**单一页面**局部引入 Pre-rendering，不影响整体 CSR 架构（局部例外，非全局 SSR）。

## 关联

- [v4.0 优化设施说明](../v4.0-优化设施说明.md)
- [ADR-006: 可观测性方案](./adr-006-observability.md)
