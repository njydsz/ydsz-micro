<!--
 * 富空状态：替代原生 "暂无数据" 占位，提供图标 + 标题 + 描述 + 引导操作。
 *
 * 设计目标：
 *  - 复用 ForgeLab forge-admin 空状态风格：居中面图形图标 + 主说明 + 副说明 + 操作按钮；
 *  - 支持预设场景（created / no-data / no-result / no-permission / error 等），也可自定义图标；
 *  - 垂直水平居中于父容器，故父容器需 h-full/网格布局或其他能撑高的结构。
 *
 * 无障碍：图标装饰性，aria-hidden=true；按钮通过具名 slot 传入以保证语义正确。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\empty-state\YdEmptyState.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed } from 'vue';

import { YdButton } from '../../primitives';
import { cn } from '@ydsz-core/shared/utils';
import { type CircleOff, FolderOpen, Inbox, SearchX, ShieldAlert } from 'lucide-vue-next';

defineOptions({
  name: 'YdEmptyState',
});

interface Props {
  /** 描述文本（副标题，解释为何为空） */
  description?: string;
  /** 预设场景图标，传入后不再使用自定义 icon 插槽 */
  preset?: 'created' | 'error' | 'no-data' | 'no-permission' | 'no-result';
  /** 自定义类名 */
  class?: string;
  /** 标题（主说明） */
  title?: string;
  /** 操作按钮文案，传入后显示操作按钮 */
  actionText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  preset: 'no-data',
  title: '暂无数据',
});

const emit = defineEmits<{
  (e: 'action'): void;
}>();

/** 根据 preset 选择图标组件与色调 */
const iconComponent = computed(() => {
  const map: Record<NonNullable<Props['preset']>, typeof CircleOff> = {
    created: Inbox,
    error: ShieldAlert,
    'no-data': FolderOpen,
    'no-permission': ShieldAlert,
    'no-result': SearchX,
  };
  return map[props.preset];
});

/** 默认标题（当未传入 title 时按 preset 提供语义化兜底） */
const displayTitle = computed<string>(() => {
  if (props.title !== '暂无数据') {
    return props.title;
  }
  const map: Record<NonNullable<Props['preset']>, string> = {
    created: '开始创建',
    error: '加载出错',
    'no-data': '暂无数据',
    'no-permission': '暂无权限',
    'no-result': '未找到匹配结果',
  };
  return map[props.preset];
});

function handleAction(): void {
  emit('action');
}
</script>

<template>
  <div
    :class="
      cn(
        'flex h-full min-h-[200px] w-full flex-col items-center justify-center text-center',
        props.class,
      )
    "
  >
    <!-- 图标区 -->
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-text-tertiary">
      <!-- 自定义图标插槽优先级最高 -->
      <slot name="icon">
        <component
          :is="iconComponent"
          :size="32"
          aria-hidden="true"
        />
      </slot>
    </div>

    <!-- 标题 -->
    <h3 class="mb-1 text-sm font-medium text-text-secondary">
      {{ displayTitle }}
    </h3>

    <!-- 描述 -->
    <p
      v-if="description"
      class="mb-4 max-w-[280px] text-xs text-text-tertiary leading-relaxed"
    >
      {{ description }}
    </p>

    <!-- 默认创建按钮（可覆盖为 actions slot） -->
    <div v-if="actionText">
      <slot name="default-action">
        <YdButtonSmart
          size="sm"
          @click="handleAction"
        >
          {{ actionText }}
        </YdButtonSmart>
      </slot>
    </div>

    <!-- 额外内容区（info tips 等） -->
    <slot name="extra" />
  </div>
</template>
