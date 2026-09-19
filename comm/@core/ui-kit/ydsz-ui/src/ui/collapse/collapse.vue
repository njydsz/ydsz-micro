<!--
 * Collapse 折叠面板：一组可展开/收起的面板列，支持手风琴模式。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\collapse\collapse.vue
 * @author ydsz-ai
 * @since 1.0.0
 -->
<script setup lang="ts">
import type { CollapseEmits, CollapseProps } from './collapse-types';

import { computed, ref, watch } from 'vue';

import { ChevronDown } from '@ydsz-core/icons';

defineOptions({ name: 'YdCollapse' });

const props = withDefaults(defineProps<CollapseProps>(), {
  accordion: false,
  bordered: true,
  collapsible: true,
  expandIconPosition: 'start',
});

const emit = defineEmits<CollapseEmits>();

/** 展开的 key 集合 */
const activeKeys = ref<Set<string>>(new Set(props.activeKeys ?? []));

watch(
  () => props.activeKeys,
  (val) => {
    activeKeys.value = new Set(val ?? []);
  },
);

/** 切换面板 */
function toggle(key: string): void {
  if (props.isDisabled) return;
  const item = props.items.find((i) => i.key === key);
  if (item?.isDisabled) return;

  const newSet = new Set(activeKeys.value);

  if (newSet.has(key)) {
    newSet.delete(key);
  } else {
    if (props.accordion) {
      newSet.clear();
    }
    newSet.add(key);
  }

  activeKeys.value = newSet;
  const keysArr = [...newSet];
  emit('update:activeKeys', keysArr);
  emit('change', keysArr);
}

/** 是否展开 */
function isActive(key: string): boolean {
  return activeKeys.value.has(key);
}

/** 扁平化序列（便于手风琴动画） */
const flatItems = computed(() => props.items.map((item, idx) => ({ ...item, _idx: idx })));
</script>

<template>
  <div
    :class="[
      'yd-collapse',
      props.class,
      { 'yd-collapse--bordered': bordered },
      { 'yd-collapse--disabled': isDisabled },
    ]"
  >
    <template v-for="item in flatItems" :key="item.key">
      <div
        :class="[
          'yd-collapse__item',
          { 'yd-collapse__item--active': isActive(item.key) },
          { 'yd-collapse__item--disabled': item.isDisabled },
        ]"
      >
        <!-- 头部 -->
        <div
          class="yd-collapse__header"
          role="button"
          :aria-expanded="isActive(item.key)"
          :aria-disabled="item.isDisabled"
          tabindex="0"
          @click="toggle(item.key)"
          @keydown.enter="toggle(item.key)"
          @keydown.space.prevent="toggle(item.key)"
        >
          <ChevronDown
            v-if="expandIconPosition === 'start'"
            :class="['yd-collapse__arrow', { 'yd-collapse__arrow--active': isActive(item.key) }]"
          />
          <span class="yd-collapse__title">{{ item.title }}</span>
          <span v-if="item.extra" class="yd-collapse__extra">{{ item.extra }}</span>
          <ChevronDown
            v-if="expandIconPosition === 'end'"
            :class="['yd-collapse__arrow', { 'yd-collapse__arrow--active': isActive(item.key) }]"
          />
        </div>

        <!-- 内容区 -->
        <Transition name="yd-collapse-toggle">
          <div v-show="isActive(item.key)" class="yd-collapse__content">
            <slot :name="item.key" />
          </div>
        </Transition>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.yd-collapse {
  display: flex;
  flex-direction: column;

  &--bordered {
    border: 1px solid var(--ydsz-color-border, #d9d9d9);
    border-radius: 6px;
    overflow: hidden;
  }
}

.yd-collapse__item {
  border-bottom: 1px solid var(--ydsz-color-border-light, #f0f0f0);

  &:last-child {
    border-bottom: none;
  }

  &--disabled {
    opacity: 0.5;
  }
}

.yd-collapse__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color var(--ydsz-motion-duration-fast, 150ms);

  &:hover {
    background: var(--ydsz-color-bg-hover, #f5f5f5);
  }

  &:focus-visible {
    outline: 2px solid var(--ydsz-color-primary, #1677ff);
    outline-offset: -2px;
  }
}

.yd-collapse__title {
  flex: 1;
}

.yd-collapse__extra {
  color: var(--ydsz-color-text-secondary, #999);
  font-size: 12px;
  font-weight: 400;
}

.yd-collapse__arrow {
  width: 16px;
  height: 16px;
  color: var(--ydsz-color-text-secondary, #999);
  transition: transform var(--ydsz-motion-duration-normal, 200ms) var(--ydsz-motion-easing-standard);
  flex-shrink: 0;

  &--active {
    transform: rotate(180deg);
  }
}

.yd-collapse__content {
  padding: 0 16px 12px;
  font-size: 14px;
}

/* 折叠动画 */
.yd-collapse-toggle-enter-active,
.yd-collapse-toggle-leave-active {
  transition: grid-template-rows 200ms cubic-bezier(0.4, 0, 0.2, 1);
  display: grid;
  grid-template-rows: 1fr;
}

.yd-collapse-toggle-enter-from,
.yd-collapse-toggle-leave-to {
  grid-template-rows: 0fr;
}
</style>
