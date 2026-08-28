# ADR-001: 微前端运行时选型 — 自研 ESM micro-kernel vs 引入 qiankun

- **状态**: 已采纳（v3.0.0 落地，2026-08 追溯补记）
- **决策人**: ydsz-team
- **关联代码**: `comm/effects/micro-kernel/`、`comm/effects/micro-runtime/`

## 背景

主应用需同时承载 8 个独立开发、独立部署的 Vue 3 子应用。候选方案：

1. **qiankun**：成熟社区方案，基于 import-html-entry + UMD + eval 沙箱
2. **wujie / micro-app**：iframe / webComponent 隔离路线
3. **自研 ESM 直引内核**：manifest.json + dynamic import + importmap 共享依赖

## 决策

选择自研 ESM 直引内核，核心理由契合团队「最小化外部依赖、绝对可控」的工程原则：

- 全部子应用同团队、统一构建链、同源部署 —— 无需 HTML 解析 / UMD 兼容 / eval 沙箱等为异构场景付出的成本
- ESM 原生 import 消除 eval 类沙箱的 CSP 冲突（nginx 已启用 strict-dynamic CSP）
- importmap 三级共享策略（core / core-ui / all，见 `conf/vite-config/src/micro-shared-deps.ts`）保证 Vue/Pinia/Element Plus 主子单实例
- 内核能力（保活调度、错误降级、版本灰度、路由预测）可按自身场景裁剪演进

## 后果

- 正面：无第三方微前端框架依赖；加载链路可观测、可调试（chrome/ DevTools 扩展）；SRI+CSP 安全链可内建
- 负面：内核自身需要测试与维护投入（当前 10 个单测覆盖核心链路）；面向不可信三方子应用的 iframe 沙箱为预留能力（见 ADR-007 支持矩阵）
- 演进约束：子应用必须输出标准 manifest.json 与生命周期导出（mount/unmount），由 vite-plugin-manifest 统一保证
