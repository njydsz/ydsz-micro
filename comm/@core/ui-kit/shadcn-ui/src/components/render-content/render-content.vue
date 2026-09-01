<!--
 * 把「内容」这一概念收敛成统一入口：content 同时接受组件、渲染函数与普通字符串，
 * 让上层（表格列、菜单项、提示文案）不必各自判断类型再分支渲染。
 *
 * renderBr 服务于纯文本场景：把字符串中的换行符渲染成段落，
 * 使运营文案可以直接写多行文本而不必在内容里拼 HTML。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\render-content\render-content.vue
 * @author ydsz-team
 * @since 1.0.0
 * @remarks
-->
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
