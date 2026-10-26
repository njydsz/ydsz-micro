// @vitest-environment jsdom
/**
 * 全局搜索结果页伴生测试（P1-13）。
 *
 * <p>验证 GlobalSearch 的渲染结构、关键词双向绑定、loading / 空态 / 分页分支，
 * 以及高亮片段确实经过 v-safe-html 白名单消毒。
 *
 * <p>环境选 jsdom：happy-dom 的 `<template>` 不会把 innerHTML 解析进 `.content`，
 * 而 sanitize() 正是基于 template.content 遍历白名单，在 happy-dom 下消毒结果恒为空串，
 * 高亮分支无法被真实验证。
 *
 * <p>i18n 桩让 t() 回显 key（与 vue-i18n 缺词条时的行为一致），因此断言针对 key
 * 与结构而非中文文案；文案本身由各语种词典与 key parity 门禁保证。
 *
 * @path apps/system-web/src/views/global-search/index.test.ts
 * @author ydsz-team
 * @since 26.10.14
 */


import type { SearchResultItem, SearchResponse } from '#/api/globalSearch';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { hotKeywords, search, summary, zeroResultKeywords } from '#/api/globalSearch';
// 子路径导入，避开对 '@ydsz/common-ui' 的 mock 影响，与 main/src/setup/app.ts 的注册方式一致
import { vSafeHtml } from '@ydsz/common-ui/es/safe-html';

// ── Mock 依赖 ──────────────────────────────────────────────

vi.mock('#/api/globalSearch', () => ({
  search: vi.fn(),
  hotKeywords: vi.fn(),
  zeroResultKeywords: vi.fn(),
  summary: vi.fn(),
}));

vi.mock('#/composables/use-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// ── 被测组件 ─────────────────────────────────────────────

import GlobalSearch from './index.vue';

// ── 测试用例 ──────────────────────────────────────────────

/** 触发一次回车搜索并等待渲染落地 */
async function searchBy(wrapper: ReturnType<typeof mount>, keyword: string) {
  await wrapper.find('.search-input').setValue(keyword);
  await wrapper.find('.search-btn').trigger('click');
  await flushPromises();
  await nextTick();
}

describe('GlobalSearch', () => {
  function createWrapper() {
    return mount(GlobalSearch, {
      global: {
        // 页面用例绕过 createSubApp 启动流程，需自行注册 bootstrap 阶段挂载的全局指令
        directives: { 'safe-html': vSafeHtml },
      },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(search).mockResolvedValue({ total: 0, items: [], took: 42 });
    vi.mocked(hotKeywords).mockResolvedValue([
      { keyword: '任务', count: 10 },
      { keyword: '审批', count: 5 },
    ]);
    vi.mocked(zeroResultKeywords).mockResolvedValue([]);
    vi.mocked(summary).mockResolvedValue({ totalSearches: 1000, zeroResultRate: 0.05 });
  });

  it('应成功渲染组件', () => {
    expect(createWrapper().exists()).toBe(true);
  });

  it('应渲染搜索输入框与搜索按钮', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.search-input').exists()).toBe(true);
    expect(wrapper.find('.search-btn').exists()).toBe(true);
  });

  it('分类 Tab 应按固定顺序绑定各自的 i18n key', () => {
    const wrapper = createWrapper();
    const tabs = wrapper.findAll('.tab-item');
    expect(tabs).toHaveLength(5);
    expect(tabs.map((tab) => tab.text())).toEqual([
      'system.search.tabAll',
      'system.search.tabTask',
      'system.search.tabMessage',
      'system.search.tabRule',
      'system.search.tabDoc',
    ]);
  });

  it('输入框 v-model 应绑定 keyword 响应式变量', async () => {
    const wrapper = createWrapper();
    const input = wrapper.find('.search-input');
    await input.setValue('测试关键词');
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe('测试关键词');
  });

  it('空关键词时应渲染空状态提示', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.flex.flex-col').exists()).toBe(true);
    expect(wrapper.text()).toContain('system.search.emptyHint');
  });

  it('加载中应切换到 loading 分支并禁用搜索按钮', async () => {
    // 永不确定化的 Promise，把组件钉在 loading === true
    vi.mocked(search).mockReturnValue(new Promise<SearchResponse>(() => {}));
    const wrapper = createWrapper();
    await searchBy(wrapper, '审批');
    expect(wrapper.text()).toContain('system.search.loading');
    expect(wrapper.find('.search-btn').attributes('disabled')).toBeDefined();
  });

  it('结果总数超过 pageSize 时应渲染分页控件', async () => {
    vi.mocked(search).mockResolvedValue({ total: 45, items: [{ id: '1', title: '审批单' }] });
    const wrapper = createWrapper();
    await searchBy(wrapper, '审批');
    const pagination = wrapper.find('.mt-6');
    expect(pagination.exists()).toBe(true);
    // 45 条 / 每页 20 条 = 3 页，当前第 1 页
    expect(pagination.text()).toContain('1 / 3');
  });

  it('无结果时应渲染 noResult 提示与零结果率', async () => {
    vi.mocked(search).mockResolvedValue({ total: 0, items: [] });
    const wrapper = createWrapper();
    await searchBy(wrapper, '不存在的词');
    expect(wrapper.text()).toContain('system.search.noResult');
    expect(wrapper.text()).toContain('system.search.zeroResultRate');
  });

  it('高亮片段应经 v-safe-html 白名单消毒', async () => {
    const items: SearchResultItem[] = [
      {
        id: '1',
        title: '审批单',
        highlight: ['<mark>审批</mark>单', '<img src="x" onerror="window.__xss = 1">'],
      },
    ];
    vi.mocked(search).mockResolvedValue({ total: 1, items });
    const wrapper = createWrapper();
    await searchBy(wrapper, '审批');

    const highlighted = wrapper.findAll('.result-item .mr-2');
    expect(highlighted).toHaveLength(2);
    expect(highlighted[0]!.element.innerHTML).toContain('<mark>');
    // img 不在白名单：整段降级为文本，且不得留下任何可执行属性
    expect(highlighted[1]!.element.querySelector('img')).toBeNull();
    expect((window as Window & { __xss?: number }).__xss).toBeUndefined();
  });
});
