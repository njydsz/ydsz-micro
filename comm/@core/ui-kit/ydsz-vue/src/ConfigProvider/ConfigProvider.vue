<!--
 * ConfigProvider — 全局配置提供者（对齐 radix-vue / reka-ui 同名组件）。
 *
 * vendored 源码中该目录缺失，导致 shared/useId、useDirection、useNonce、
 * useBodyScrollLock 等引用 '@/ConfigProvider/ConfigProvider.vue' 中的
 * injectConfigProviderContext 无法解析。
 *
 * 职责：向子树 provide dir / locale / nonce / useId 配置；
 * 未包裹时，各 use* 助手通过 fallback 值安全降级。
 *
 * @path comm/@core/ui-kit/ydsz-vue/src/ConfigProvider/ConfigProvider.vue
 * @author ydsz-team
 * @since 5.1.0
-->
<script lang="ts">
import type { Ref } from 'vue';
import { ref } from 'vue';

import type { Direction } from '../shared/types';

import { createContext } from '../shared';

export interface ConfigProviderContext {
  /** 文本方向（ltr / rtl），未提供时回退 'ltr' */
  dir: Ref<Direction>;
  /** 区域设置，未提供时回退 'en' */
  locale: Ref<string>;
  /** 随机数生成配置（透传给 useNonce） */
  nonce: Ref<string | undefined>;
  /** 自定义 id 生成器（透传给 useId） */
  useId?: (...args: any[]) => string;
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
}

/**
 * 注入 ConfigProvider 上下文；各助手调用时均传入 fallback，
 * 因此组件外使用不会抛错，仅使用默认值。
 */
export const [injectConfigProviderContext, provideConfigProviderContext]
  = createContext<ConfigProviderContext>('ConfigProvider', {
    dir: ref('ltr'),
    locale: ref('en'),
    nonce: ref(),
    useId: undefined,
  });
</script>

<script setup lang="ts">
import { toRef } from 'vue';

import { useForwardExpose } from '../shared';

const props = defineProps<ConfigProviderProps>();

provideConfigProviderContext({
  dir: toRef(() => props.dir ?? 'ltr'),
  locale: toRef(() => props.locale ?? 'en'),
  nonce: toRef(() => props.nonce?.value),
  useId: props.useId,
});

useForwardExpose();
</script>

<template>
  <slot />
</template>
