/**
 * SelectContent 上下文契约（类型 + provide/inject 对 + 默认值）。
 *
 * <p>从 SelectContentImpl.vue 抽离到独立文件，解除
 * SelectContentImpl ↔ SelectItemAlignedPosition 的循环依赖：
 * 两者都需要注入 content context，但谁都不该依赖对方的渲染逻辑。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\Select\SelectContentContext.ts
 * @author ydsz-team
 * @since 26.11.06
 */
import type { Ref } from 'vue';

import { createContext } from '../shared/index.ts';

export interface SelectContentContext {
  content?: Ref<HTMLElement | undefined>;
  viewport?: Ref<HTMLElement | undefined>;
  onViewportChange: (node: HTMLElement | undefined) => void;
  itemRefCallback: (node: HTMLElement | undefined, value: string, disabled: boolean) => void;
  selectedItem?: Ref<HTMLElement | undefined>;
  onItemLeave?: () => void;
  itemTextRefCallback: (node: HTMLElement | undefined, value: string, disabled: boolean) => void;
  focusSelectedItem?: () => void;
  selectedItemText?: Ref<HTMLElement | undefined>;
  position?: 'item-aligned' | 'popper';
  isPositioned?: Ref<boolean>;
  searchRef?: Ref<string>;
}

export const SelectContentDefaultContextValue: SelectContentContext = {
  onViewportChange: () => {},
  itemTextRefCallback: () => {},
  itemRefCallback: () => {},
};

export const [injectSelectContentContext, provideSelectContentContext] =
  createContext<SelectContentContext>('SelectContent');
