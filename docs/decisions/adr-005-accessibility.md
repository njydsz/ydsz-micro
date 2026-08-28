# ADR-005: 可访问性（a11y）基线与验收方式

- **状态**: 部分落地，基线验收由 E2E 承接（v4.4.0）
- **关联代码**: `e2e/specs/main-smoke.spec.ts`（axe 扫描）、`e2e/playwright.config.ts`

## 背景

README 与云顶编码规范第 11 章均要求语义化 HTML / 键盘可访问性 / ARIA / 颜色对比度，此前缺少自动化验收手段（@axe-core/playwright 已声明但无用例）。

## 决策

1. **工具**：@axe-core/playwright（对齐 Deque axe 规则集），随 Playwright 冒烟执行
2. **基线**：主链路页面 `wcag2a` + `wcag21a` 严重度 `critical=0` 为阻断线；`serious` 及以下先报告不阻断，按迭代收敛
3. **范围**：v4.4.0 先覆盖登录页（`/auth/login`）；后续每个新增主链路页面随 PR 补充扫描用例
4. **CI**：`e2e-smoke` job 手动触发（用例稳定后放开至 PR 必跑）

## 后果

- 正面：a11y 从人工抽查转为自动化基线；违规项可在 PR 阶段定位
- 负面：axe 静态规则无法覆盖纯键盘操作路径，复杂交互仍需人工抽测
