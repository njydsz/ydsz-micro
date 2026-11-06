/**
 * 全局搜索结果页伴生测试
 *
 * @path apps/system-web/src/views/global-search/index.test.ts
 * @author ydsz-team
 * @since 26.11.06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mount } from '@vue/test-utils';

// ── Mock 依赖 ──────────────────────────────────────────────

vi.mock('#/api/globalSearch', () => ({
  search: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  hotKeywords: vi.fn().mockResolvedValue([]),
  zeroResultKeywords: vi.fn().mockResolvedValue([]),
  summary: vi.fn().mockResolvedValue({}),
}));

vi.mock('#/composables/use-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// ── 被测组件 ──────────────────────────────────────────────

import GlobalSearch from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

describe('GlobalSearch', () => {
  function createWrapper() {
    return mount(GlobalSearch);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应成功渲染组件', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('应渲染搜索输入框', () => {
    const wrapper = createWrapper();
    const input = wrapper.find('#global-search-input');
    expect(input.exists()).toBe(true);
  });

  it('应渲染搜索按钮', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.search-btn').exists()).toBe(true);
  });

  it('应渲染分类 Tab', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.search-tabs').exists()).toBe(true);
    const tabs = wrapper.findAll('.tab-item');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('应渲染容器', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.global-search-container').exists()).toBe(true);
  });

  it('搜索输入框应有正确的占位符', () => {
    const wrapper = createWrapper();
    const input = wrapper.find('#global-search-input');
    expect(input.attributes('placeholder')).toBe('system.search.placeholder');
  });
});
