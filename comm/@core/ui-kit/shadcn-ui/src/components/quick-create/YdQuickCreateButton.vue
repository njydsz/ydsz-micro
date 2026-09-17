<!--
 * 快捷创建悬浮按钮：仿 ForgeLab forge-admin 全局创建入口。
 *
 * 设计目标：
 *  - 固定悬浮于页面底中偏右（与 YdSettingsFloatButton 错开）；
 *  - 点击展开快捷创建菜单（流程模板 / 规则 / Agent / 消息批次...）；
 *  - 菜单项通过 props 注册，支持子应用各自挂载自己的创建入口。
 *
 * 交互：
 *  - 第一次点击展开菜单，再次点击或点击外部区域收起；
 *  - 菜单项 hover 时显示描述文字；
 *  - 移动端自动贴边。
 *
 * 无障碍：
 *  - 按钮带 aria-label / aria-expanded；
 *  - 菜单项通过 role="menuitem" 暴露语义。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\quick-create\YdQuickCreateButton.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { onClickOutside } from '@vueuse/core';
import { cn } from '@ydsz-core/shared/utils';
import { Plus, X } from 'lucide-vue-next';

defineOptions({
  name: 'YdQuickCreateButton',
});

export interface QuickCreateItem {
  /** 菜单项点击后触发的回调函数（替代硬编码路由跳转，解耦组件与路由） */
  action?: () => void;
  /** 显示文案 */
  label: string;
  /** 图标组件 */
  icon?: typeof Plus;
  /** 唯一标识 */
  key: string;
  /** 路由路径（可选，由父级 emit 后自行路由跳转） */
  path?: string;
  /** 可选描述（hover 时显示） */
  description?: string;
}

interface Props {
  /** 创建菜单项（通常来自各子应用注册） */
  items: QuickCreateItem[];
  /** 按钮变体：primary（蓝） | orange（暖） | neutral（灰） */
  variant?: 'primary' | 'orange' | 'neutral';
  /** 距底部距离（px） */
  bottom?: number;
  /** 距右侧距离（px） */
  right?: number;
  /** 自定义类名 */
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  bottom: 96,
  items: () => [],
  right: 24,
  variant: 'orange',
});

const emit = defineEmits<{
  (e: 'select', item: QuickCreateItem): void;
}>();

const expanded = ref<boolean>(false);
const containerRef = ref<HTMLElement | null>(null);

/** 按钮背景色变体 */
const buttonClass = computed<string>(() => {
  const map: Record<NonNullable<Props['variant']>, string> = {
    neutral: 'bg-neutral-700 hover:bg-neutral-600',
    orange: 'bg-orange-500 hover:bg-orange-400',
    primary: 'bg-primary hover:bg-primary/90',
  };
  return map[props.variant];
});

/** 展开/收起菜单 */
function toggle(): void {
  expanded.value = !expanded.value;
}

/** 收起菜单 */
function collapse(): void {
  expanded.value = false;
}

/** 处理菜单项点击 */
function handleItemClick(item: QuickCreateItem): void {
  emit('select', item);
  collapse();
  // 优先调用明确传入的 action 回调；未传则交由父级通过 @select 处理路由跳转
  if (item.action) {
    item.action();
  }
}

/** ESC 关闭菜单 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    collapse();
  }
}

onClickOutside(containerRef, () => {
  collapse();
});

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    ref="containerRef"
    :class="cn('fixed z-50 flex flex-col items-center gap-3', className)"
    :style="{ bottom: `${bottom}px`, right: `${right}px` }"
  >
    <!-- 菜单项（从下往上展开） -->
    <TransitionGroup
      tag="div"
      class="flex flex-col items-center gap-2"
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-90"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-90"
    >
      <div
        v-for="(item, idx) in items"
        v-show="expanded"
        :key="item.key"
        class="flex items-center gap-2"
        :style="{ transitionDelay: `${idx * 30}ms` }"
      >
        <!-- 描述文字 -->
        <span
          v-if="item.description"
          class="max-w-[160px] truncate rounded-md border border-border-subtle bg-surface-2 px-2 py-1 text-xs text-text-secondary shadow-sm"
        >
          {{ item.description }}
        </span>
        <!-- 菜单项按钮 -->
        <button
          class="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-text-primary shadow-lg transition-transform hover:scale-110 active:scale-95"
          role="menuitem"
          type="button"
          :aria-label="`创建${item.label}`"
          @click="handleItemClick(item)"
        >
          <slot :name="item.key">
            <component
              :is="item.icon ?? Plus"
              :size="16"
            />
          </slot>
        </button>
      </div>
    </TransitionGroup>

    <!-- 主按钮 -->
    <button
      :aria-expanded="expanded"
      aria-label="快捷创建"
      class="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
      type="button"
      :class="cn(buttonClass, expanded && 'rotate-45')"
      @click="toggle"
    >
      <Plus
        v-if="!expanded"
        :size="24"
      />
      <X
        v-else
        :size="24"
      />
    </button>
  </div>
</template>
