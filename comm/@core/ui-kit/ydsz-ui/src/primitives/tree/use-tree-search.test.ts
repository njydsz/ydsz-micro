/**
 * useTreeSearch 测试 —— 验证扁平化搜索、祖先展开与高亮区间
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit/ydsz-ui/src/ui/tree/use-tree-search.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import { nextTick, ref } from 'vue';

import { useTreeSearch } from './use-tree-search';

/** 测试用的树节点类型 */
interface TestNode {
  children?: TestNode[];
  id: string;
  name: string;
}

/** 构造一棵测试树 */
function createTestTree(): TestNode[] {
  return [
    {
      children: [
        { id: '1-1', name: '前端开发' },
        { id: '1-2', name: '前端架构' },
        {
          children: [
            { id: '1-3-1', name: 'React 开发' },
            { id: '1-3-2', name: 'Vue 开发' },
          ],
          id: '1-3',
          name: '前端框架',
        },
      ],
      id: '1',
      name: '技术部',
    },
    {
      children: [
        { id: '2-1', name: 'UI 设计' },
        { id: '2-2', name: 'UX 研究' },
      ],
      id: '2',
      name: '设计部',
    },
  ];
}

describe('useTreeSearch', () => {
  it('搜索空字符串应返回空结果', () => {
    const treeData = ref(createTestTree());
    const { results, search } = useTreeSearch(treeData, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });

    search('');
    expect(results.value.length).toBe(0);
  });

  it('搜索 "前端" 应匹配多个节点', async () => {
    const treeData = ref(createTestTree());
    const { results, search, expandKeys } = useTreeSearch(treeData, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });

    search('前端');
    await nextTick();

    // "技术部" 的子节点 + "前端架构" + "前端框架" 应该被匹配
    expect(results.value.length).toBeGreaterThan(0);

    // 匹配节点的父路径应该被包含在 expandKeys 中
    const expandKeySet = expandKeys.value;
    // 根节点 "技术部" 的 id 应该在展开集合中
    expect(expandKeySet.has('1')).toBe(true);
  });

  it('搜索的 label 区间应正确标注', () => {
    const treeData = ref(createTestTree());
    const { results, search } = useTreeSearch(treeData, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });

    search('Vue');
    const vueResult = results.value.find((r) => r.value === '1-3-2');
    expect(vueResult).toBeDefined();
    expect(vueResult?.label).toBe('Vue 开发');
    expect(vueResult?.matchRange).toEqual({ end: 3, start: 0 });
  });

  it('clear 应清空关键字和结果', () => {
    const treeData = ref(createTestTree());
    const { results, expandKeys, search, hasResults, keyword } = useTreeSearch(
      treeData,
      {
        getChildren: (n) => n.children,
        getLabel: (n) => n.name,
        getValue: (n) => n.id,
      },
    );

    search('设计');
    expect(keyword.value).toBe('设计');
    expect(hasResults.value).toBe(true);

    // clear 后应重置
    keyword.value = '';
    expect(hasResults.value).toBe(false);
  });

  it('无匹配的搜索应返回空节点列表', () => {
    const treeData = ref(createTestTree());
    const { results, search } = useTreeSearch(treeData, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });

    search('不存在的关键字xyz');
    expect(results.value.length).toBe(0);
  });

  it('无搜索关键字时 expandKeys 应为空', () => {
    const treeData = ref(createTestTree());
    const { expandKeys } = useTreeSearch(treeData, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });

    expect(expandKeys.value.size).toBe(0);
  });
});
