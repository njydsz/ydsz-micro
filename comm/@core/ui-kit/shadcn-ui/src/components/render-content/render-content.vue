<!--
 * render-content 通用组件
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\render-content\render-content.vue
 * @author ydsz-team
 * @since 1.0.0
 *
 * @remarks
 * 通用内容渲染组件，支持渲染字符串、组件或函数。
 * - 字符串内容：直接渲染，支持换行符转段落
 * - 组件/函数：使用 h() 渲染为 VNode
 */
<script setup lang="ts">
import type { Component } from 'vue';

import { h } from 'vue';

import { isFunction, isObject, isString } from '@YDSZ-core/shared/utils';

defineOptions({
  name: 'RenderContent',
});

/** Props 定义 */
const props = withDefaults(
  defineProps<{
    /** 渲染内容：组件、函数或字符串 */
    content?: (() => unknown) | Component | string;
    /** 是否将字符串换行符渲染为段落 */
    renderBr?: boolean;
  }>(),
  {
    content: undefined,
    renderBr: false,
  },
);

/** 渲染函数 */
const renderContent = () => {
  if (!props.content) {
    return null;
  }
  const isComponent =
    (isObject(props.content) || isFunction(props.content)) &&
    props.content !== null;
  if (!isComponent) {
    if (props.renderBr && isString(props.content)) {
      const lines = props.content.split('\n');
      const result = [];
      for (const [i, line] of lines.entries()) {
        result.push(h('p', { key: `line-${i}` }, line));
      }
      return result;
    } else {
      return props.content;
    }
  }
  return h(props.content as never);
};
</script>

<template>
  <component :is="renderContent()" />
</template>
