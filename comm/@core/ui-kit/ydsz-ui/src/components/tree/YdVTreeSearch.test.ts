/**
 * YdVTreeSearch 组件测试 —— 搜索结果渲染与匹配高亮
 *
 * <p>覆盖点：option 渲染、mark 高亮分段、highlightMatch=false 关闭高亮，
 * 以及标签含 HTML 片段时只按纯文本输出（原 v-html 注入面的回归用例）。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tree\YdVTreeSearch.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import { nextTick } from 'vue';

import { mount } from '@vue/test-utils';

import YdVTreeSearch from './YdVTreeSearch.vue';
import { zhCN } from '../../locale/zh-CN';

/** 组件默认字段名（label / value / children）下的树节点 */
interface TreeRow extends Record<string, unknown> {
  children?: TreeRow[];
  label: string;
  value: string;
}

const treeData: TreeRow[] = [
  {
    children: [
      { label: '前端组', value: 'fe' },
      { label: '后端组', value: 'be' },
    ],
    label: '技术部',
    value: 'tech',
  },
];

/**
 * 挂载组件并触发一次搜索。
 *
 * <p>走 defineExpose 的 search 而非输入框，避免 200ms 防抖计时器。
 *
 * @param keyword - 搜索关键字
 * @param extraProps - 覆盖默认配置的额外 props
 * @returns 渲染完成后的 wrapper
 */
async function mountWithSearch(
  keyword: string,
  extraProps: Record<string, unknown> = {},
) {
  const wrapper = mount(YdVTreeSearch, {
    props: { treeData, ...extraProps },
  });
  wrapper.vm.search(keyword);
  await nextTick();
  return wrapper;
}

describe('YdVTreeSearch 搜索结果渲染', () => {
  it('命中时渲染 option，文本为节点标签', async () => {
    const wrapper = await mountWithSearch('前端');
    const options = wrapper.findAll('[role="option"]');
    expect(options).toHaveLength(1);
    expect(options[0]?.text()).toBe('前端组');
  });

  it('匹配片段渲染为单个 mark，前后缀保持纯文本', async () => {
    const wrapper = await mountWithSearch('前端');
    const marks = wrapper.findAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]?.text()).toBe('前端');
  });

  it('highlightMatch=false 时不产生 mark，但结果仍在', async () => {
    const wrapper = await mountWithSearch('前端', { highlightMatch: false });
    expect(wrapper.findAll('mark')).toHaveLength(0);
    expect(wrapper.find('[role="option"]').text()).toBe('前端组');
  });

  it('标签含 HTML 片段时按纯文本输出，不生成对应元素', async () => {
    const wrapper = await mountWithSearch('img', {
      treeData: [{ label: '<img src=x onerror=alert(1)>组', value: 'xss' }],
    });
    const option = wrapper.find('[role="option"]');
    expect(option.find('img').exists()).toBe(false);
    expect(option.text()).toBe('<img src=x onerror=alert(1)>组');
    expect(wrapper.findAll('mark')).toHaveLength(1);
  });

  it('无命中时展示空态文案且不渲染 option', async () => {
    const wrapper = await mountWithSearch('不存在的节点');
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0);
    // 空态取自内置词典（复用 empty.search），断言词典值而非界面字面量
    expect(wrapper.text()).toContain(zhCN['empty.search']);
  });

  it('点击结果项抛出 select（值与节点）', async () => {
    const wrapper = await mountWithSearch('后端');
    await wrapper.find('[role="option"]').trigger('click');
    expect(wrapper.emitted('select')?.[0]?.[0]).toBe('be');
  });
});
