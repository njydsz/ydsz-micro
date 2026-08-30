# 无障碍（a11y）合规扫描集成方案

> **版本**：v1.0.0  
> **适用范围**：ydsz-micro 前端项目  
> **日期**：2026-08-30  
> **状态**：草案

---

## 1. 背景与目标

### 1.1 当前问题

1. 部分组件缺少 ARIA 属性，屏幕阅读器无法正确识别
2. 颜色对比度不符合 WCAG AA 标准
3. 部分交互元素不支持键盘操作
4. 表单元素缺少关联标签

### 1.2 目标

1. 自动化 a11y 扫描，CI 门禁阻塞违规
2. 核心页面 WCAG 2.1 AA 合规
3. 所有交互元素支持键盘操作
4. 颜色对比度符合 WCAG AA 标准

---

## 2. 合规标准

### 2.1 WCAG 2.1 AA 标准

| 级别    | 要求     | 说明     |
| ------- | -------- | -------- |
| **A**   | 最低要求 | 必须满足 |
| **AA**  | 推荐要求 | 目标合规 |
| **AAA** | 最高要求 | 可选     |

### 2.2 核心检查项

| 检查项           | 标准                   | 说明                             |
| ---------------- | ---------------------- | -------------------------------- |
| **颜色对比度**   | AA: 4.5:1              | 普通文本                         |
| **大文本对比度** | AA: 3:1                | 18px+ 或 14px+ 粗体              |
| **键盘可访问性** | 所有功能可通过键盘操作 | Tab/Enter/Space/Arrow            |
| **焦点管理**     | 焦点可见且逻辑清晰     | 焦点不陷阱                       |
| **语义化 HTML**  | 使用正确的语义标签     | nav/main/article/section         |
| **ARIA 属性**    | 必要时使用 ARIA        | 角色/状态/属性                   |
| **表单标签**     | 每个表单元素有关联标签 | label/aria-label/aria-labelledby |
| **图片替代文本** | 所有图片有 alt 属性    | 装饰性图片 alt=""                |

---

## 3. 工具集成

### 3.1 CI 集成 axe-core

```yaml
# .github/workflows/ci.yml 新增 a11y job
a11y-scan:
  name: 无障碍合规扫描
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: pnpm/action-setup@v4

    - name: 安装 Node.js 22
      uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm

    - name: 安装依赖
      run: pnpm install --frozen-lockfile

    - name: 构建应用
      run: pnpm build:main

    - name: 启动预览服务器
      run: pnpm preview:main &

    - name: 运行 axe-core 扫描
      run: npx @axe-core/cli http://localhost:4173 --exit

    - name: 上传扫描报告
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: a11y-report
        path: a11y-report.json
```

### 3.2 Playwright + axe-core

```typescript
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('无障碍合规', () => {
  test('首页应符合 WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('登录页应符合 WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Dashboard 应符合 WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/dashboard');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // 输出违规详情
    if (results.violations.length > 0) {
      console.table(
        results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
      );
    }

    expect(results.violations).toEqual([]);
  });
});
```

### 3.3 Vitest + jsdom-axe

```typescript
// src/__tests__/a11y.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import UserCard from '#/components/UserCard.vue';

expect.extend(toHaveNoViolations);

const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'heading-order': { enabled: true },
    'link-name': { enabled: true },
  },
});

describe('UserCard 无障碍', () => {
  it('should have no accessibility violations', async () => {
    const wrapper = mount(UserCard, {
      props: {
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
      },
    });

    const results = await axe(wrapper.element);
    expect(results).toHaveNoViolations();
  });
});
```

---

## 4. 开发规范

### 4.1 语义化 HTML

```vue
<!-- ✅ 正确：语义化结构 -->
<template>
  <nav aria-label="主导航">
    <ul>
      <li><a href="/dashboard">仪表盘</a></li>
      <li><a href="/user">用户管理</a></li>
    </ul>
  </nav>
  <main>
    <h1>页面标题</h1>
    <section aria-labelledby="section-title">
      <h2 id="section-title">章节标题</h2>
      <p>内容...</p>
    </section>
  </main>
  <footer>版权信息</footer>
</template>

<!-- ❌ 错误：全部使用 div -->
<template>
  <div class="nav">
    <div class="link">仪表盘</div>
  </div>
  <div class="main">
    <div class="title">页面标题</div>
  </div>
</template>
```

### 4.2 键盘可访问性

```vue
<!-- ✅ 正确：自定义按钮支持键盘 -->
<template>
  <div
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    自定义按钮
  </div>
</template>

<!-- ✅ 正确：焦点管理 -->
<script setup lang="ts">
const buttonRef = ref<HTMLElement>();

async function handleSubmit() {
  await submitData();
  buttonRef.value?.focus();
}
</script>
```

### 4.3 ARIA 属性

```vue
<!-- ✅ 正确：动态内容通知 -->
<div aria-live="polite" aria-atomic="true">
  {{ statusMessage }}
</div>

<!-- ✅ 正确：图标按钮 -->
<button aria-label="关闭对话框">
  <CloseIcon />
</button>

<!-- ✅ 正确：表单验证 -->
<input
  :aria-invalid="hasError"
  :aria-describedby="hasError ? 'error-msg' : undefined"
/>
<span id="error-msg" role="alert">{{ errorMessage }}</span>

<!-- ✅ 正确：加载状态 -->
<button :aria-busy="isLoading" :disabled="isLoading">
  <span v-if="isLoading">提交中...</span>
  <span v-else>提交</span>
</button>
```

### 4.4 颜色对比度

```css
/* ✅ 正确：符合 WCAG AA 标准 */
.text-primary {
  color: #1890ff; /* 对比度 4.6:1 */
}

.text-secondary {
  color: #595959; /* 对比度 7.5:1 */
}

/* ❌ 错误：对比度不足 */
.text-light {
  color: #cccccc; /* 对比度 1.6:1，不符合 AA */
}
```

### 4.5 表单可访问性

```vue
<!-- ✅ 正确：显式关联 -->
<label for="email">邮箱地址</label>
<input id="email" type="email" v-model="email" />

<!-- ✅ 正确：隐式关联 -->
<label>
  邮箱地址
  <input type="email" v-model="email" />
</label>

<!-- ✅ 正确：使用 aria-labelledby -->
<span id="label">邮箱地址</span>
<input aria-labelledby="label" type="email" />

<!-- ❌ 错误：无标签 -->
<input type="email" placeholder="请输入邮箱" />
```

---

## 5. 检查清单

### 5.1 Pre-PR 自查

- [ ] 使用语义化 HTML 标签
- [ ] 所有交互元素支持键盘操作
- [ ] 焦点管理逻辑正确
- [ ] 颜色对比度符合 WCAG AA
- [ ] 表单元素有关联标签
- [ ] 图片有 alt 属性
- [ ] 动态内容使用 aria-live
- [ ] 图标按钮有 aria-label

### 5.2 自动化检查

```bash
# 运行 axe-core 扫描
pnpm a11y:scan

# 运行 a11y 单元测试
pnpm test:a11y

# 生成 a11y 报告
pnpm a11y:report
```

---

## 6. 监控与告警

### 6.1 关键指标

| 指标               | 目标  | 告警阈值    |
| ------------------ | ----- | ----------- |
| a11y 违规数        | 0     | > 0 阻塞 PR |
| 颜色对比度合规率   | 100%  | < 100% 告警 |
| 键盘可访问性覆盖率 | 100%  | < 100% 告警 |
| 语义化 HTML 覆盖率 | > 90% | < 90% 告警  |

### 6.2 日志格式

```json
{
  "timestamp": "2026-08-30T10:00:00.000Z",
  "level": "error",
  "message": "a11y violation detected",
  "violation": "color-contrast",
  "impact": "serious",
  "element": ".text-light",
  "page": "/dashboard"
}
```

---

## 7. 实施计划

### 7.1 第一阶段（1 周）

1. 集成 axe-core 到 CI
2. 编写 a11y 测试用例
3. 修复高优先级违规
4. 建立 a11y 检查清单

### 7.2 第二阶段（2 周）

1. 修复中优先级违规
2. 完善 ARIA 属性
3. 优化键盘导航
4. 颜色对比度调整

### 7.3 第三阶段（持续）

1. 新功能 a11y 自查
2. 定期 a11y 扫描
3. a11y 培训
4. 文档更新

---

## 8. 资源与工具

### 8.1 开发工具

| 工具                       | 用途                  | 链接                                 |
| -------------------------- | --------------------- | ------------------------------------ |
| **axe DevTools**           | 浏览器扩展，手动扫描  | Chrome Web Store                     |
| **Lighthouse**             | Chrome 内置，综合审计 | Chrome DevTools                      |
| **WAVE**                   | 在线 a11y 评估        | wave.webaim.org                      |
| **Color Contrast Checker** | 对比度检查            | webaim.org/resources/contrastchecker |

### 8.2 学习资源

| 资源                  | 说明               |
| --------------------- | ------------------ |
| **WCAG 2.1**          | 官方标准           |
| **MDN Accessibility** | MDN 无障碍指南     |
| **Vue Accessibility** | Vue 官方无障碍指南 |

---

## 9. 总结

无障碍合规是产品质量的重要指标，通过自动化扫描、开发规范和持续监控，确保所有用户都能正常使用产品。

---

> **文档维护**：本方案由 ydsz-team 负责，如有疑问请提交 Issue。
