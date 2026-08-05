# ADR-005: 无障碍屏幕阅读器测试集成

## 状态

已接受 (Accepted) — 2026-08-05

## 背景

项目当前已通过 `@axe-core/playwright` 实现了自动化无障碍检测（e2e/accessibility.spec.ts），覆盖 WCAG 2.1 AA 级别规则。但存在以下盲区：

1. **axe-core 无法检测**：语义化的 ARIA 使用是否恰当、屏幕阅读器朗读顺序是否合理
2. **缺少真实屏幕阅读器测试**：NVDA（Windows）、VoiceOver（macOS）
3. **缺少键盘导航录制**：Tab 焦点路径是否合理
4. **颜色对比度检测不足**：当前仅检查静态文本，缺少交互状态（hover/focus/disabled）

## 决策

实施 **「axe-core 自动化 + 屏幕阅读器 E2E + 键盘导航录制」** 三层无障碍测试策略。

### 层级一：自动化检测（已有，持续增强）

**工具**：`@axe-core/playwright`

当前已接入 `e2e/accessibility.spec.ts`，覆盖：
- 颜色对比度
- ARIA 属性正确性
- 表单标签关联
- 焦点可访问性

**增强方向**：
- 增加交互状态下的 a11y 检测（展开/关闭、hover、focus）
- 子应用页面全覆盖（当前仅覆盖主应用）
- 接入 CI 门禁，PR 检测不通过则阻断合并

### 层级二：键盘导航录制（新增）

**工具**：`@playwright/test` + 自定义录制脚本

```typescript
// e2e/keyboard-navigation.spec.ts
test('核心流程 - 键盘导航覆盖', async ({ page }) => {
  await page.goto('/');
  const tabPath: string[] = [];

  // 记录 Tab 遍历路径
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || 'unknown');
    tabPath.push(focused);
  }

  // 验证焦点不陷入死循环、不跳过关键交互
  expect(tabPath).toMatchSnapshot('keyboard-tab-path');
});
```

### 层级三：真实屏幕阅读器测试（新增）

**工具选型**：

| 工具 | 平台 | 成本 | 适用场景 |
|------|------|------|----------|
| **NVDA** | Windows | 免费 | 开发自测 |
| **VoiceOver** | macOS | 免费（内置） | 开发自测 |
| **JAWS** | Windows | 付费 | 合规验收 |
| **Screen Reader Testing API** | - | - | CI 模拟 |

**推荐方案**：
- 开发阶段：开发者本地使用 macOS VoiceOver 或 Windows NVDA 手动测试
- 自动化阶段：暂无完美自动化方案（屏幕阅读器依赖 OS TTS），建议：
  1. 录制屏幕阅读器音频输出（验证朗读内容是否合理）
  2. 使用 Accessibility Tree 快照对比（Playwright 支持 `accessibility.snapshot()`）

### 实施 Playwright Accessibility Tree 快照

```typescript
// e2e/a11y-snapshot.spec.ts
test('主页面 - Accessibility Tree 快照', async ({ page }) => {
  await page.goto('/');
  const snapshot = await page.accessibility.snapshot();

  // 输出 Accessibility Tree 结构（可被屏幕阅读器解析的语义树）
  expect(snapshot).toMatchSnapshot('a11y-tree-main-page');
});
```

Playwright 的 `accessibility.snapshot()` 返回简化 Accessibility Tree，可用于：
1. 检测关键元素是否有正确的 role/name
2. 对比页面升级前后语义树变化（回归检测）
3. 作为屏幕阅读器的"预期输出"参考

## 迁移计划

### Phase 1: 现有检测增强（1 周）

- [ ] 修改 accessibility.spec.ts，增加子应用页面扫描
- [ ] 增加交互状态检测（展开菜单、打开弹窗后重新扫描）
- [ ] 设置 CI 门禁（已有 `test:a11y` 脚本）

### Phase 2: 键盘导航录制（3 天）

- [ ] 实现 `e2e/keyboard-navigation.spec.ts`
- [ ] 录制核心流程 Tab 顺序（登录 → 主页面 → 子应用导航 → 返回）
- [ ] 建立 Tab 路径快照基线

### Phase 3: Accessibility Tree 快照（2 天）

- [ ] 实现 `e2e/a11y-snapshot.spec.ts`
- [ ] 覆盖主要页面：登录页、dashboard、各子应用首页
- [ ] 建立快照基线，PR 检测变化

### Phase 4: 屏幕阅读器自测指南（1 天）

- [ ] 编写《无障碍测试指南》文档
- [ ] macOS VoiceOver 快捷键清单
- [ ] Windows NVDA 安装与测试流程
- [ ] 常见问题修复对照表

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 快照对比过于敏感 | 使用 stable selector（data-testid 而非随机 class） |
| 导航路径基线易变 | 仅在核心流程使用快照，局部交互使用精确断言 |
| 团队屏幕阅读器使用不熟练 | 提供 15 分钟速通文档 + 季度 a11y 培训 |

## 参考

- [axe-core 规则列表](https://dequeuniversity.com/rules/axe/)
- [Playwright Accessibility](https://playwright.dev/docs/api/class-accessibility)
- [WCAG 2.1 规范](https://www.w3.org/TR/WCAG21/)
- [屏幕阅读器用户视角](https://webaim.org/projects/screenreadersurvey/)
- ADR-002: 测试策略分层
