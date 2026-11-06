import fs from 'node:fs';

const lockPath = 'comm/@core/ui-kit/ydsz-vue/src/shared/useBodyScrollLock.ts';
let c = fs.readFileSync(lockPath, 'utf8');
c = c.replace(
  "from '../ConfigProvider/ConfigProvider.vue'",
  "from '../ConfigProvider/ConfigProviderContext'",
);
fs.writeFileSync(lockPath, c, 'utf8');
console.log('useBodyScrollLock ok');

const cpPath = 'comm/@core/ui-kit/ydsz-vue/src/ConfigProvider/ConfigProvider.vue';
c = fs.readFileSync(cpPath, 'utf8');

const oldBlock = `import type { Ref } from 'vue';

import type { Direction } from '../shared/types';

import { createContext } from '../shared';

export interface ConfigProviderContext {
  /** 文本方向（ltr / rtl），未提供时回退 'ltr' */
  dir: Ref<Direction>;
  /** 区域设置，未提供时回退 'en' */
  locale: Ref<string>;
  /** 随机数生成配置（透传给 useNonce） */
  nonce: Ref<string | undefined>;
  /** 锁滚动时是否补偿 padding / margin（透传给 useBodyScrollLock） */
  scrollBody: Ref<boolean | ConfigProviderScrollBodyOptions>;
  /** 自定义 id 生成器（透传给 useId） */
  useId?: (...args: any[]) => string;
}

/** useBodyScrollLock 的补偿配置：true 表示取实测滚动条宽度 */
export interface ConfigProviderScrollBodyOptions {
  /** 右侧 padding 补偿量 */
  padding?: number | string | true;
  /** 右侧 margin 补偿量 */
  margin?: number | string | true;
}

export interface ConfigProviderProps {`;

const newBlock = `import type { Ref } from 'vue';

import type { Direction } from '../shared/types';

import type {
  ConfigProviderContext,
  ConfigProviderScrollBodyOptions,
} from './ConfigProviderContext';

// re-export 保持对外 API 不变（原先从本文件导出类型与 context）
export type {
  ConfigProviderContext,
  ConfigProviderScrollBodyOptions,
} from './ConfigProviderContext';
export {
  injectConfigProviderContext,
  provideConfigProviderContext,
} from './ConfigProviderContext';

export interface ConfigProviderProps {`;

if (c.includes(oldBlock)) {
  c = c.replace(oldBlock, newBlock);
  console.log('ConfigProvider block ok');
} else {
  console.log('ConfigProvider block NOT FOUND');
}

const oldClose = `export const [injectConfigProviderContext, provideConfigProviderContext] =
  createContext<ConfigProviderContext>('ConfigProvider');
</script>`;

if (c.includes(oldClose)) {
  c = c.replace(oldClose, '</script>');
  console.log('ConfigProvider close ok');
} else {
  console.log('ConfigProvider close NOT FOUND');
}

fs.writeFileSync(cpPath, c, 'utf8');
