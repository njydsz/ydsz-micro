/**
 * 菜单实现所需的组件树工具：向上查找指定名称的父组件，以及扁平化 VNode 插槽内容。
 *
 * findComponentUpward 依赖组件的 name 选项匹配，
 * 因此 Menu / SubMenu 必须显式声明 name，改成匿名组件会让层级查找全部失效。
 * flattedChildren 用于在插槽里遍历出实际的菜单项 VNode，
 * 因为插槽内容可能被 Fragment 或数组层层包裹，直接遍历只能拿到最外层。
 *
 * @path comm\@core\ui-kit\menu-ui\src\utils\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  ComponentInternalInstance,
  VNode,
  VNodeChild,
  VNodeNormalizedChildren,
} from 'vue';

import { isVNode } from 'vue';

type VNodeChildAtom = Exclude<VNodeChild, Array<unknown>>;
type RawSlots = Exclude<VNodeNormalizedChildren, Array<unknown> | null | string>;

type FlattenVNodes = Array<RawSlots | VNodeChildAtom>;

/**
 * @zh_CN Find the parent component upward
 * @param instance
 * @param parentNames
 */
function findComponentUpward(
  instance: ComponentInternalInstance,
  parentNames: string[],
) {
  let parent = instance.parent;
  while (parent && !parentNames.includes(parent?.type?.name ?? '')) {
    parent = parent.parent;
  }
  return parent;
}

const flattedChildren = (
  children: FlattenVNodes | VNode | VNodeNormalizedChildren,
): FlattenVNodes => {
  const vNodes = Array.isArray(children) ? children : [children];
  const result: FlattenVNodes = [];

  vNodes.forEach((child) => {
    if (Array.isArray(child)) {
      result.push(...flattedChildren(child));
    } else if (isVNode(child) && Array.isArray(child.children)) {
      result.push(...flattedChildren(child.children));
    } else {
      result.push(child);
      if (isVNode(child) && child.component?.subTree) {
        result.push(...flattedChildren(child.component.subTree));
      }
    }
  });
  return result;
};

export { findComponentUpward, flattedChildren };
