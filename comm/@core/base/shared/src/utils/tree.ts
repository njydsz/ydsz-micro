/**
 * 树形结构遍历、过滤与映射工具集，支撑菜单/权限树的递归查询与转换。
 *
 * @path comm\@core\base\shared\src\utils\tree.ts
 * @author ydsz-team
 * @since 1.0.0
 */
/** 树形结构配置：指定子节点数组字段名，默认 'children' */
interface TreeConfigOptions {
  /** 子节点数组在节点对象上的属性名 */
  childProps: string;
}

/**
 * 深度优先遍历树形结构，收集所有节点的指定字段值（自动过滤 falsy）。
 *
 * @param tree - 树形结构根节点数组
 * @param getValue - 从节点中提取目标值的函数
 * @param options - 子节点数组字段名配置，默认 `{ childProps: 'children' }`
 * @returns 所有节点对应字段值的扁平数组（已过滤 falsy）
 */
function traverseTreeValues<T, V>(
  tree: T[],
  getValue: (node: T) => V,
  options?: TreeConfigOptions,
): V[] {
  const result: V[] = [];
  const { childProps } = options || {
    childProps: 'children',
  };

  const dfs = (treeNode: T) => {
    const value = getValue(treeNode);
    result.push(value);
    const children = (treeNode as Record<string, unknown>)?.[childProps] as
      | T[]
      | undefined;
    if (!children) {
      return;
    }
    for (const child of children) {
      dfs(child);
    }
  };

  for (const treeNode of tree) {
    dfs(treeNode);
  }
  return result.filter(Boolean);
}

/**
 * 按条件递归过滤树形结构节点，保留匹配节点并递归处理其子树。
 *
 * @param tree - 待过滤的树形结构根节点数组
 * @param filter - 节点匹配谓词，返回 true 时保留该节点
 * @param options - 子节点数组字段名配置，默认 `{ childProps: 'children' }`
 * @returns 过滤后的树形结构数组
 */
function filterTree<T>(
  tree: T[],
  filter: (node: T) => boolean,
  options?: TreeConfigOptions,
): T[] {
  const { childProps } = options || {
    childProps: 'children',
  };

  const _filterTree = (nodes: T[]): T[] => {
    return nodes.filter((node) => {
      if (filter(node)) {
        const record = node as Record<string, unknown>;
        if (record[childProps]) {
          record[childProps] = _filterTree(record[childProps] as T[]);
        }
        return true;
      }
      return false;
    });
  };

  return _filterTree(tree);
}

/**
 * 递归映射树形结构的每个节点，返回新树并保留嵌套关系。
 *
 * @param tree - 待映射的树形结构根节点数组
 * @param mapper - 节点转换函数，将旧节点映射为新节点
 * @param options - 子节点数组字段名配置，默认 `{ childProps: 'children' }`
 * @returns 映射后的新树形结构数组
 */
function mapTree<T, V>(
  tree: T[],
  mapper: (node: T) => V,
  options?: TreeConfigOptions,
): V[] {
  const { childProps } = options || {
    childProps: 'children',
  };
  return tree.map((node) => {
    const mapperNode = mapper(node) as Record<string, unknown>;
    if (mapperNode[childProps]) {
      // 递归映射子节点：子节点已经过一次 mapper 转换（V 类型），
      // 而 mapper 形参类型为 T → V，此处收窄为 V → V 以通过类型检查
      mapperNode[childProps] = mapTree(
        mapperNode[childProps] as V[],
        mapper as unknown as (node: V) => V,
        options,
      );
    }
    return mapperNode as V;
  });
}

export { filterTree, mapTree, traverseTreeValues };
