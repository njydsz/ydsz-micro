<script lang="ts">
/**
 * ConfigProvider — 全局配置提供者（对齐 radix-vue / reka-ui 同名组件）。
 *
 * 职责：向子树 provide dir / locale / nonce / scrollBody / useId 配置。
 *
 * 未包裹本组件时不会抛错：injectConfigProviderContext 的 fallback 由各 use* 助手
 * 在调用处逐个给出（如 useDirection 给 dir、useBodyScrollLock 给 scrollBody），
 * 因此 headless 层单独使用也能安全降级到默认值。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\ConfigProvider\ConfigProvider.vue
 * @author ydsz-team
 * @since 5.1.0
 */
import type { Ref } from 'vue';

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

export interface ConfigProviderProps {
  /** 自定义 id 生成函数 */
  useId?: (...args: any[]) => string;
  /** 文本方向 */
  dir?: Direction;
  /** 区域设置 */
  locale?: string;
  /** nonce 响应式引用 */
  nonce?: Ref<string | undefined>;
  /** 浮层锁滚动时的 padding / margin 补偿策略 */
  scrollBody?: boolean | ConfigProviderScrollBodyOptions;
}

/**
 * 注入 ConfigProvider 上下文；各助手调用时均传入 fallback，
 * 因此组件外使用不会抛错，仅使用默认值。
 */
export const [injectConfigProviderContext, provideConfigProviderContext]
  = createContext<ConfigProviderContext>('ConfigProvider');
</script>

<script setup lang="ts">
import { toRef } from 'vue';

import { useForwardExpose } from '../shared';

const props = defineProps<ConfigProviderProps>();

provideConfigProviderContext({
  dir: toRef(() => props.dir ?? 'ltr'),
  locale: toRef(() => props.locale ?? 'en'),
  nonce: toRef(() => props.nonce?.value),
  scrollBody: toRef(() => props.scrollBody ?? true),
  useId: props.useId,
});

useForwardExpose();
</script>

<template>
  <slot />
</template>
