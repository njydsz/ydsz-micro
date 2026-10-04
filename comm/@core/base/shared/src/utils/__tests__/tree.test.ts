/**
 * tree.ts 工具函数单元测试
 *
 * 覆盖：traverseTreeValues / filterTree / mapTree
 *
 * @path comm\@core\base\shared\src\utils\__tests__\tree.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { filterTree, mapTree, traverseTreeValues } from '../tree';

// ---------------------------------------------------------------------------
// 测试数据
// ---------------------------------------------------------------------------

interface TreeNode {
  id: number;
  name: string;
  children?: TreeNode[];
}

const sampleTree: TreeNode[] = [
  {
    id: 1,
    name: 'root-a',
    children: [
      { id: 2, name: 'child-a1' },
      {
        id: 3,
        name: 'child-a2',
        children: [{ id: 4, name: 'grand-a2-1' }],
      },
    ],
  },
  { id: 5, name: 'root-b' },
];

// ---------------------------------------------------------------------------
// traverseTreeValues
// ---------------------------------------------------------------------------

describe('traverseTreeValues', () => {
  it('应深度优先提取所有节点 id 并过滤 falsy', () => {
    const ids = traverseTreeValues(sampleTree, (node) => node.id);
    expect(ids).toEqual([1, 2, 3, 4, 5]);
    expect(ids).toHaveLength(5);
  });

  it('应深度优先提取所有节点 name 并过滤空字符串', () => {
    const treeWithEmpty: TreeNode[] = [
      { id: 1, name: '', children: [{ id: 2, name: 'valid' }] },
    ];
    const names = traverseTreeValues(treeWithEmpty, (node) => node.name);
    expect(names).toEqual(['valid']);
  });

  it('应支持自定义子节点字段名', () => {
    const customTree = [
      { id: 1, name: 'a', items: [{ id: 2, name: 'b' }] },
    ];
    const ids = traverseTreeValues(
      customTree,
      (node) => node.id,
      { childProps: 'items' },
    );
    expect(ids).toEqual([1, 2]);
  });

  it('空数组输入应返回空数组', () => {
    const result = traverseTreeValues<TreeNode, number>(
      [],
      (node) => node.id,
    );
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// filterTree（自顶向下：父节点被过滤则整棵子树丢弃）
// ---------------------------------------------------------------------------

describe('filterTree', () => {
  it('应保留匹配节点并递归处理其子树', () => {
    // 仅保留 id 为 5 的节点 root-b
    const filtered = filterTree(sampleTree, (node) => node.id === 5);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(5);
    expect(filtered[0].name).toBe('root-b');
  });

  it('父节点不匹配时整棵子树被丢弃', () => {
    // root-a (id=1) 和 root-b (id=5) 均不包含 "xyz"，整棵树被过滤为空
    const filtered = filterTree(sampleTree, (node) =>
      node.name.includes('xyz'),
    );
    expect(filtered).toEqual([]);
    expect(filtered).toHaveLength(0);
  });

  it('应支持自定义子节点字段名进行过滤', () => {
    const customTree = [
      {
        id: 1,
        name: 'a',
        items: [
          { id: 2, name: 'keep' },
          { id: 3, name: 'drop' },
        ],
      },
    ];
    const filtered = filterTree(
      customTree,
      (node) => node.id !== 3,
      { childProps: 'items' },
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].items).toHaveLength(1);
    expect(filtered[0].items?.[0].name).toBe('keep');
  });

  it('无匹配节点时应返回空数组', () => {
    const filtered = filterTree(sampleTree, (node) => node.id === 999);
    expect(filtered).toEqual([]);
    expect(filtered).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// mapTree
// ---------------------------------------------------------------------------

describe('mapTree', () => {
  it('应对每个节点执行映射并保留层级结构', () => {
    const mapped = mapTree(sampleTree, (node) => ({
      ...node,
      label: `[${node.name}]`,
    }));
    expect(mapped).toHaveLength(2);
    expect(mapped[0].label).toBe('[root-a]');
    expect(mapped[0].children?.[0].label).toBe('[child-a1]');
    expect(mapped[0].children?.[1].children?.[0].label).toBe(
      '[grand-a2-1]',
    );
  });

  it('应支持类型转换（如去掉 children 字段）', () => {
    const flatNodes = mapTree(sampleTree, (node) => ({
      id: node.id,
      name: node.name.toUpperCase(),
    }));
    expect(flatNodes.every((n) => !('children' in n))).toBe(true);
    expect(flatNodes[0].name).toBe('ROOT-A');
  });

  it('应支持自定义子节点字段名的映射', () => {
    const customTree = [
      { id: 1, name: 'a', items: [{ id: 2, name: 'b' }] },
    ];
    const mapped = mapTree(
      customTree,
      (node) => ({ ...node, name: node.name.toUpperCase() }),
      { childProps: 'items' },
    );
    expect(mapped[0].name).toBe('A');
    expect(mapped[0].items?.[0].name).toBe('B');
  });

  it('空数组输入应返回空数组', () => {
    const result = mapTree<TreeNode, TreeNode>([], (node) => node);
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});
