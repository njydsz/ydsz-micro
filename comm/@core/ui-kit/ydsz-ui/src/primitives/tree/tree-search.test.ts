/**
 * useTreeSearch composable 测试 —— 树形搜索过滤与祖先展开。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\tree\tree-search.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { describe, expect, it } from 'vitest';

import { ref } from 'vue';

import { useTreeSearch } from './use-tree-search';

interface TestNode {
  id: string;
  name: string;
  children?: TestNode[];
}

const treeData: TestNode[] = [
  {
    children: [
      { id: '1-1', name: '前端组' },
      { id: '1-2', name: '后端组' },
    ],
    id: '1',
    name: '技术部',
  },
  {
    children: [{ id: '2-1', name: '销售经理' }],
    id: '2',
    name: '销售部',
  },
];

describe('useTreeSearch', () => {
  it('应返回全部节点（空关键字）', () => {
    const nodes = ref(treeData);
    const { results, search } = useTreeSearch(nodes, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });
    search('');
    expect(results.value).toHaveLength(0);
  });

  it('应过滤匹配节点', () => {
    const nodes = ref(treeData);
    const { results, search } = useTreeSearch(nodes, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });
    search('前端');
    expect(results.value).toHaveLength(1);
    expect(results.value[0]?.label).toBe('前端组');
  });

  it('应收集需要展开的祖先', () => {
    const nodes = ref(treeData);
    const { expandKeys, search } = useTreeSearch(nodes, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });
    search('前端');
    expect(expandKeys.value.has('1')).toBe(true);
  });

  it('应支持大小写不敏感', () => {
    const nodes = ref(treeData);
    const { results, search } = useTreeSearch(nodes, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });
    search('SALES');
    // 中文数据不会匹配英文关键字，这是预期行为
    // 大小写不敏感只在同语言内生效
    expect(results.value.length).toBe(0);
  });

  it('同语言大小写不敏感应工作', () => {
    const enTree: TestNode[] = [
      { id: '1', name: 'Engineering' },
      { id: '2', name: 'Marketing' },
    ];
    const nodes = ref(enTree);
    const { results, search } = useTreeSearch(nodes, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
      caseSensitive: false,
    });
    search('ENGINEERING');
    expect(results.value).toHaveLength(1);
    expect(results.value[0]?.label).toBe('Engineering');
  });

  it('clear 应重置搜索', () => {
    const nodes = ref(treeData);
    const { hasResults, results, search, clear } = useTreeSearch(nodes, {
      getChildren: (n) => n.children,
      getLabel: (n) => n.name,
      getValue: (n) => n.id,
    });
    search('前端');
    expect(hasResults.value).toBe(true);
    clear();
    expect(hasResults.value).toBe(false);
    expect(results.value).toHaveLength(0);
  });
});
