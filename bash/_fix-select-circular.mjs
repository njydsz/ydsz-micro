import fs from 'node:fs';

const implPath = 'comm/@core/ui-kit/ydsz-vue/src/Select/SelectContentImpl.vue';
let c = fs.readFileSync(implPath, 'utf8');

const oldBlock = `import {
  createContext,
  useBodyScrollLock,
  useCollection,
  useFocusGuards,
  useForwardProps,
  useHideOthers,
  useTypeahead,
} from '../shared/index.ts';

interface SelectContentContext {
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
};`;

const newBlock = `import {
  useBodyScrollLock,
  useCollection,
  useFocusGuards,
  useForwardProps,
  useHideOthers,
  useTypeahead,
} from '../shared/index.ts';

import type { SelectContentContext } from './SelectContentContext';

// re-export 保持对外 API 不变
export type { SelectContentContext } from './SelectContentContext';
export {
  injectSelectContentContext,
  provideSelectContentContext,
  SelectContentDefaultContextValue,
} from './SelectContentContext';`;

if (c.includes(oldBlock)) {
  c = c.replace(oldBlock, newBlock);
  console.log('SelectContentImpl block ok');
} else {
  console.log('SelectContentImpl block NOT FOUND');
}

const oldCtx = `export const [injectSelectContentContext, provideSelectContentContext] =
  createContext<SelectContentContext>('SelectContent');
</script>`;

if (c.includes(oldCtx)) {
  c = c.replace(oldCtx, '</script>');
  console.log('SelectContentImpl ctx ok');
} else {
  console.log('SelectContentImpl ctx NOT FOUND');
}

fs.writeFileSync(implPath, c, 'utf8');

// SelectItemAlignedPosition: 改依赖独立文件
const alignedPath = 'comm/@core/ui-kit/ydsz-vue/src/Select/SelectItemAlignedPosition.vue';
let a = fs.readFileSync(alignedPath, 'utf8');
a = a.replace(
  "import { injectSelectContentContext } from './SelectContentImpl.vue';",
  "import { injectSelectContentContext } from './SelectContentContext';",
);
fs.writeFileSync(alignedPath, a, 'utf8');
console.log('SelectItemAlignedPosition ok');
