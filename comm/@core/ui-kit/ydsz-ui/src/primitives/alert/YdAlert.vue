<script lang="ts" setup>
import { cn } from '@ydsz-core/shared/utils';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
  X,
} from 'lucide-vue-next';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否可关闭 */
  closable?: boolean;
  /** 标题 */
  title?: string;
  /** 关闭回调 */
  type?: 'success' | 'info' | 'warning' | 'error';
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: true,
  closable: false,
  type: 'info',
});

const emit = defineEmits<{
  close: [];
}>();

const icons: Record<string, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeStyles: Record<string, string> = {
  success: 'border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-300',
  info: 'border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300',
  warning: 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300',
  error: 'border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-300',
};
</script>

<template>
  <div
    :class="
      cn(
        'relative flex gap-3 rounded-lg border px-4 py-3 text-sm',
        typeStyles[props.type],
        props.class,
      )
    "
    role="alert"
  >
    <component :is="icons[props.type]" v-if="props.showIcon" class="mt-0.5 size-4 shrink-0" />
    <div class="flex-1">
      <p v-if="props.title" class="mb-0.5 font-semibold">{{ props.title }}</p>
      <slot></slot>
    </div>
    <button
      v-if="props.closable"
      type="button"
      class="ml-2 shrink-0 rounded p-1 opacity-60 hover:opacity-100 transition-opacity"
      aria-label="关闭"
      @click="emit('close')"
    >
      <X class="size-3.5" />
    </button>
  </div>
</template>
