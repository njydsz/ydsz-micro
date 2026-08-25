# ADR-005: 可访问性（Accessibility）方案

- **状态**：已采纳（Accepted），基础能力部分落地
- **日期**：2026-08（评估归档）
- **决策人**：ydsz-frontend-team

## 背景（Context）

Gitee 对标竞品（RuoYi / pig / JeecgBoot 等）普遍未将可访问性作为差异化能力。
YDSZ Micro 将「可访问性」列为与竞品的核心差异化要点之一（见 README 竞品对标章节）。
目标：核心页面满足屏幕阅读器可访问、键盘可达、对比度合规。

## 决策（Decision）

采用 **axe-core** 作为可访问性自动化校验底座：

- 依赖 `@axe-core/playwright`（`^4.10.0`，已纳入工作区依赖），在 Playwright 集成中执行 axe 规则扫描。
- 扫描范围：各子应用核心页面（登录页、首页、骨架屏、主布局）。
- 与性能预算（Lighthouse CI）并列，作为发布前质量门禁的一部分。

## 现状与缺口（以代码事实为准）

| 项 | 状态 |
| -- | ---- |
| `@axe-core/playwright` 依赖 | ✅ 已声明 |
| Playwright 配置文件（`playwright.config.*`） | ⚠️ 尚未落地 |
| `e2e/` 目录下的 a11y 用例 | ⚠️ 目录为空，待补充 |
| `pnpm test:a11y` 脚本 | ⚠️ 尚未接入（见 Roadmap） |

> 说明：可访问性能力在 README 与竞品对标中作为**差异化卖点**提出，但其自动化测试闭环（配置 + 脚本 + 用例）
> 当前未完全落地。本 ADR 记录决策意图，缺口列入 Roadmap 跟踪，避免文档过度承诺。

## 后果（Consequences）

- **正面**：决策方向明确，后续补足 Playwright 配置与用例即可形成可访问性门禁。
- **负面**：当前缺乏可执行校验，a11y 合规程度未被持续度量。

## 关联

- [ADR-006: 可观测性方案](./adr-006-observability.md)
- 云顶编码规范（前端）— 可访问性相关条款
