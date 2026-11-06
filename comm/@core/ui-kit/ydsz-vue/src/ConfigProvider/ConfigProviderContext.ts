/**
 * ConfigProvider 上下文契约（类型 + provide/inject 对）。
 *
 * <p>从 ConfigProvider.vue 抽离到独立文件，解除
 * shared/useBodyScrollLock → ConfigProvider.vue → shared/index 的循环依赖：
 * 需要上下文的助手与 ConfigProvider 组件都只依赖本文件，
 * 本文件不反向依赖任何组件。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\ConfigProvider\ConfigProviderContext.ts
 * @author ydsz-team
 * @since 26.11.06
 */
import type { Ref } from 'vue';

import type { Direction } from '../shared/types';

import { createContext } from '../shared';

/** useBodyScrollLock 的补偿配置：true 表示取实测滚动条宽度 */
export interface ConfigProviderScrollBodyOptions {
  /** 右侧 padding 补偿量 */
  padding?: number | string | true;
  /** 右侧 margin 补偿量 */
  margin?: number | string | true;
}

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
  useId?: (...args: unknown[]) => string;
}

/**
 * 注入 ConfigProvider 上下文；各助手调用时均传入 fallback，
 * 因此组件外使用不会抛错，仅使用默认值。
 */
export const [injectConfigProviderContext, provideConfigProviderContext] =
  createContext<ConfigProviderContext>('ConfigProvider');
