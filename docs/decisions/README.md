# 架构决策记录（ADR）

本目录按 [ADR 模式](https://adr.github.io/) 记录本项目的重要架构决策。

## 编号规则

- 编号顺序递增（ADR-001、ADR-002 …）
- 每个 ADR 文件命名：`adr-NNN-<slug>.md`

## 现有记录

| 编号 | 主题 | 状态 | 文件 |
| ---- | ---- | ---- | ---- |
| ADR-001 | 微前端运行时选型（自研 ESM micro-kernel vs qiankun） | 已采纳（v3.0.0 落地） | [adr-001-micro-kernel-vs-qiankun.md](adr-001-micro-kernel-vs-qiankun.md) |
| ADR-002 | Monorepo 工具链选型（pnpm + turbo + vsh） | 已采纳 | [adr-002-monorepo-toolchain.md](adr-002-monorepo-toolchain.md) |
| ADR-003 | SSR / Pre-rendering 方案评估 | 已评估，暂不实施（骨架屏+预加载替代） | [adr-003-ssr-pre-rendering.md](adr-003-ssr-pre-rendering.md) |
| ADR-005 | 可访问性（Accessibility）基线与验收 | 部分落地（axe E2E 基线，v4.4.0） | [adr-005-accessibility.md](adr-005-accessibility.md) |
| ADR-006 | 前端可观测性体系（错误/性能/预加载指标） | 已采纳（v4.4.0 补齐指标回环） | [adr-006-observability.md](adr-006-observability.md) |
| ADR-007 | 三沙箱支持矩阵（iframe 降 experimental） | 已采纳（v4.4.0） | [adr-007-sandbox-matrix.md](adr-007-sandbox-matrix.md) |

> **说明**：ADR-004 编号被跳过（其议题并入 ADR-005 可访问性方案），后续新增决策沿用下一可用编号（008）。
