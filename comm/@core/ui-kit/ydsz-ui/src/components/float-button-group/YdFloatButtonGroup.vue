<script lang="ts" setup>
/**
 * 浮动按钮组：固定在右下角的按钮集合，支持点击触发器展开/收起。
 *
 * direction 控制子项展开方向（up / down / left / right），通过 flex 主轴与
 * order 反转实现；open 为受控属性，支持 v-model:open。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\float-button-group\YdFloatButtonGroup.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { FloatButtonGroupEmits, FloatButtonGroupProps } from './types';

import { computed } from 'vue';

import { Plus } from 'lucide-vue-next';

import { cn } from '@ydsz-core/shared/utils';

import { useLocale } from '../../locale/useLocale';

const { t } = useLocale();

defineOptions({ name: 'YdFloatButtonGroup' });

const props = withDefaults(defineProps<FloatButtonGroupProps>(), {
  direction: 'up',
  icon: undefined,
  open: false,
});

const emit = defineEmits<FloatButtonGroupEmits>();

function toggleOpen(): void {
  emit('update:open', !props.open);
}

/** 展开方向的布局类名 */
const directionClasses = computed<Record<string, string>>(() => ({
  up: 'flex-col-reverse',
  down: 'flex-col',
  left: 'flex-row-reverse',
  right: 'flex-row',
}));

/** 子项容器是否隐藏（未展开时） */
const listHidden = computed(() => (props.open ? '' : 'pointer-events-none opacity-0'));
</script>

<template>
  <div
    :class="cn('fixed bottom-6 right-6 z-40 flex gap-2', directionClasses[direction], props.class)"
    role="group"
    :aria-label="t('floatButtonGroup.ariaLabel')"
  >
    <!-- 按钮组内容 -->
    <div
      :class="
        cn(
          'flex gap-2 transition-all duration-300',
          directionClasses[direction],
          listHidden,
        )
      "
    >
      <slot></slot>
    </div>

    <!-- 触发器 -->
    <button
      type="button"
      :aria-expanded="props.open"
      :aria-label="props.open ? t('common.collapse') : t('common.expand')"
      :class="
        cn(
          'shadow-raised bg-primary text-primary-foreground hover:bg-primary/90',
          'flex size-12 items-center justify-center rounded-full transition-transform duration-300',
          props.open && 'rotate-45',
        )
      "
      @click="toggleOpen"
    >
      <slot name="trigger">
        <component :is="props.icon ?? Plus" class="size-5" />
      </slot>
    </button>
  </div>
</template>
