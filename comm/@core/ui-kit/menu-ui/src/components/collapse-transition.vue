<!--
 * 菜单展开/收起的高度过渡：手写的一套 JS 过渡钩子，而非 CSS transition。
 *
 * 原因是内容高度未知：CSS 无法从 height:0 过渡到 auto，
 * 只能在 beforeEnter 里先记录并清零 padding/margin、再以 max-height 做动画，
 * afterEnter 时把内联样式还原 —— 若不还原，内部嵌套的二级菜单将永远被限制在旧高度。
 * 旧值暂存在 dataset 上而不是组件变量里，因为同一时刻可能有多个子菜单在做动画。
 *
 * @path comm\@core\ui-kit\menu-ui\src\components\collapse-transition.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { RendererElement } from 'vue';

defineOptions({
  name: 'CollapseTransition',
});

const reset = (el: RendererElement) => {
  el.style.maxHeight = '';
  el.style.overflow = el.dataset.oldOverflow;
  el.style.paddingTop = el.dataset.oldPaddingTop;
  el.style.paddingBottom = el.dataset.oldPaddingBottom;
};

const on = {
  afterEnter(el: RendererElement) {
    el.style.maxHeight = '';
    el.style.overflow = el.dataset.oldOverflow;
  },

  afterLeave(el: RendererElement) {
    reset(el);
  },

  beforeEnter(el: RendererElement) {
    if (!el.dataset) el.dataset = {};

    el.dataset.oldPaddingTop = el.style.paddingTop;
    el.dataset.oldMarginTop = el.style.marginTop;

    el.dataset.oldPaddingBottom = el.style.paddingBottom;
    el.dataset.oldMarginBottom = el.style.marginBottom;
    if (el.style.height) el.dataset.elExistsHeight = el.style.height;

    el.style.maxHeight = 0;
    el.style.paddingTop = 0;
    el.style.marginTop = 0;
    el.style.paddingBottom = 0;
    el.style.marginBottom = 0;
  },

  beforeLeave(el: RendererElement) {
    if (!el.dataset) el.dataset = {};
    el.dataset.oldPaddingTop = el.style.paddingTop;
    el.dataset.oldMarginTop = el.style.marginTop;
    el.dataset.oldPaddingBottom = el.style.paddingBottom;
    el.dataset.oldMarginBottom = el.style.marginBottom;
    el.dataset.oldOverflow = el.style.overflow;
    el.style.maxHeight = `${el.scrollHeight}px`;
    el.style.overflow = 'hidden';
  },

  enter(el: RendererElement) {
    requestAnimationFrame(() => {
      el.dataset.oldOverflow = el.style.overflow;
      if (el.dataset.elExistsHeight) {
        el.style.maxHeight = el.dataset.elExistsHeight;
      } else if (el.scrollHeight === 0) {
        el.style.maxHeight = 0;
      } else {
        el.style.maxHeight = `${el.scrollHeight}px`;
      }

      el.style.paddingTop = el.dataset.oldPaddingTop;
      el.style.paddingBottom = el.dataset.oldPaddingBottom;
      el.style.marginTop = el.dataset.oldMarginTop;
      el.style.marginBottom = el.dataset.oldMarginBottom;
      el.style.overflow = 'hidden';
    });
  },

  enterCancelled(el: RendererElement) {
    reset(el);
  },

  leave(el: RendererElement) {
    if (el.scrollHeight !== 0) {
      el.style.maxHeight = 0;
      el.style.paddingTop = 0;
      el.style.paddingBottom = 0;
      el.style.marginTop = 0;
      el.style.marginBottom = 0;
    }
  },

  leaveCancelled(el: RendererElement) {
    reset(el);
  },
};
</script>

<template>
  <transition name="collapse-transition" v-on="on">
    <slot></slot>
  </transition>
</template>
