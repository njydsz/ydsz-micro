/**
 * YdTabs 组件测试 —— 验证导出。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tabs\tabs.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import YdTabs from './YdTabs.vue';
import YdTabsContent from './YdTabsContent.vue';
import YdTabsList from './YdTabsList.vue';
import YdTabsTrigger from './YdTabsTrigger.vue';

describe('YdTabs compound components', () => {
  it('YdTabs 应被定义', () => {
    expect(YdTabs).toBeDefined();
  });

  it('YdTabsList 应被定义', () => {
    expect(YdTabsList).toBeDefined();
  });

  it('YdTabsTrigger 应被定义', () => {
    expect(YdTabsTrigger).toBeDefined();
  });

  it('YdTabsContent 应被定义', () => {
    expect(YdTabsContent).toBeDefined();
  });
});
