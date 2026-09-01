<!--
 * 通用图标渲染器：按传入值的类型自动选择渲染方式。
 *
 * 同一组件兼容四种输入——Vue 组件直接渲染、http(s) 链接渲染为 img、
 * 其余字符串按 Iconify 图标名解析、都取不到时按 fallback 显示占位图标。
 * 这样做的收益是图标配置可以来自后端或配置文件（字符串），而不必在前端
 * 硬编码组件引用。
 *
 * 所有分支都加了 aria-hidden：图标是纯装饰，语义应由相邻文本或 aria-label 承载，
 * 否则读屏会读出无意义的图标名。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\icon\icon.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { Component } from 'vue';

import { computed } from 'vue';

import { IconDefault, IconifyIcon } from '@YDSZ-core/icons';
import {
  isFunction,
  isHttpUrl,
  isObject,
  isString,
} from '@YDSZ-core/shared/utils';

const props = defineProps<{
  // 没有是否显示默认图标
  fallback?: boolean;
  icon?: Component | Function | string;
}>();

const isRemoteIcon = computed(() => {
  return isString(props.icon) && isHttpUrl(props.icon);
});

const isComponent = computed(() => {
  const { icon } = props;
  return !isString(icon) && (isObject(icon) || isFunction(icon));
});
</script>

<template>
  <component
    :is="icon as Component"
    v-if="isComponent"
    v-bind="$attrs"
    aria-hidden="true"
  />
  <img
    v-else-if="isRemoteIcon"
    :src="icon as string"
    v-bind="$attrs"
    role="img"
    aria-hidden="true"
    loading="lazy"
  />
  <IconifyIcon
    v-else-if="icon"
    v-bind="$attrs"
    :icon="icon as string"
    aria-hidden="true"
  />
  <IconDefault v-else-if="fallback" v-bind="$attrs" aria-hidden="true" />
</template>

