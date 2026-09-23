<!--
 * Anchor 锚点：跳转到页面指定位置。
 *
 * 受控组件：通过 v-model:active 控制当前激活锚点。
 * offset 定义距离顶部多少像素视为"进入"。
 * YdAnchorLink 子组件递归渲染嵌套目录。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\anchor\YdAnchor.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { YdAnchorLink, type AnchorLinkItem } from './YdAnchorLink.vue';

interface Props {
  /** 锚点配置 */
  items: AnchorLinkItem[];
  /** 自定义类名 */
  class?: any;
  /** 滚动容器 CSS 选择器（默认 window） */
  container?: string;
  /** 距离顶部的偏移量 */
  offset?: number;
  /** 当前激活的锚点 key（受控） */
  activeKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  activeKey: '',
  container: undefined,
  offset: 80,
});

const emit = defineEmits<{
  'update:activeKey': [key: string];
}>();

/** 左侧导航线容器 ref */
const wrapperRef = ref<HTMLElement>();
/** 是否已完成 DOM init */
const ready = ref(false);

let containerEl: HTMLElement | Window | undefined;
let observer: IntersectionObserver | undefined;

function handleSelect(key: string): void {
  emit('update:activeKey', key);
  // 平滑滚动至对应 section
  const target = document.getElementById(key);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

onMounted(() => {
  ready.value = true;
  containerEl = props.container
    ? (document.querySelector(props.container) as HTMLElement)
    : window;

  // 用 IntersectionObserver 检测哪些 section 进入视口
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          emit('update:activeKey', entry.target.id);
        }
      }
    },
    {
      root: containerEl === window ? null : (containerEl as HTMLElement),
      rootMargin: `-${props.offset}px 0px 0px 0px`,
    },
  );

  props.items.forEach((item) => {
    observeTargets(item);
  });
});

function observeTargets(item: AnchorLinkItem): void {
  const el = document.getElementById(item.key);
  if (el && observer) {
    observer.observe(el);
  }
  if (item.children) {
    item.children.forEach((child) => observeTargets(child));
  }
}

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <nav
    ref="wrapperRef"
    :class="cn('relative border-l-2 border-border pl-4', props.class)"
    :aria-label="'锚点导航'"
    role="navigation"
  >
    <YdAnchorLink
      v-for="item in items"
      :key="item.key"
      :active-key="props.activeKey"
      :item="item"
      :offset="props.offset"
      :on-select="handleSelect"
    >
      <template #link>
        <slot name="link" :item="item"></slot>
      </template>
    </YdAnchorLink>
  </nav>
</template>
