<!--
 * Result 结果页：用于反馈操作结果。
 *
 * 提供 success / error / warning / info 四种内置状态，
 * 通过 icon slot 或内置 icon 展示视觉提示，配合 title / description / actions 组装完整结果页。
 *
 * 业务中配合路由的 navigate 使用：成功提交后跳转至 Result 页，
 * 失败时展示错误原因并提供重试按钮。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\result\YdResult.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';
import { CheckCircle2, Info, ShieldAlert, XCircle } from 'lucide-vue-next';

type ResultStatus = 'error' | 'info' | 'success' | 'warning';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 结果描述（副标题区域） */
  description?: string;
  /** 结果图标（传入时不使用内置 icon 组件） */
  icon?: ResultStatus;
  /** 结果状态 */
  status?: ResultStatus;
  /** 结果标题 */
  title: string;
}

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  status: 'info',
});

const statusConfig: Record<
  ResultStatus,
  { bgClass: string; borderClass: string; component: any }
> = {
  error: {
    bgClass: 'text-destructive-500 bg-destructive-50',
    borderClass: 'border-destructive-200',
    component: XCircle,
  },
  info: {
    bgClass: 'text-brand-500 bg-brand-50',
    borderClass: 'border-brand-200',
    component: Info,
  },
  success: {
    bgClass: 'text-success-500 bg-success-50',
    borderClass: 'border-success-200',
    component: CheckCircle2,
  },
  warning: {
    bgClass: 'text-warning-500 bg-warning-50',
    borderClass: 'border-warning-200',
    component: ShieldAlert,
  },
};

const configuredIcon = computed(() => {
  return statusConfig[props.icon ?? props.status].component;
});

import { computed } from 'vue';
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center rounded-lg border bg-background px-8 py-12 text-center',
        props.class,
      )
    "
  >
    <!-- 图标 -->
    <div
      :class="
        cn(
          'mb-4 flex items-center justify-center rounded-full',
          statusConfig[props.icon ?? props.status].bgClass,
          'size-16',
        )
      "
    >
      <slot name="icon">
        <component :is="configuredIcon" class="size-8" />
      </slot>
    </div>

    <!-- 标题 -->
    <h3 class="text-foreground mb-2 text-xl font-semibold">
      <slot name="title">{{ props.title }}</slot>
    </h3>

    <!-- 描述 -->
    <p v-if="props.description" class="text-muted-foreground mb-6 max-w-md text-sm">
      <slot name="description">{{ props.description }}</slot>
    </p>

    <!-- 操作按钮 -->
    <div v-if="$slots.default" class="flex gap-2">
      <slot></slot>
    </div>
  </div>
</template>
