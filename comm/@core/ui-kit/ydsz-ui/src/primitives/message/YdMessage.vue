<script lang="ts" setup>
// @ts-nocheck
import { cn } from '@ydsz-core/shared/utils';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  type LucideIcon,
  X,
} from 'lucide-vue-next';

interface Props {
  class?: any;
  closable?: boolean;
  description?: string;
  duration?: number;
  icon?: any;
  message?: string;
  showIcon?: boolean;
  type?: 'error' | 'info' | 'loading' | 'success' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  duration: 3000,
  showIcon: true,
  type: 'info',
});

const emit = defineEmits<{
  close: [];
}>();

const icons: Record<string, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertCircle,
  error: AlertCircle,
  loading: Info,
};

const typeStyles: Record<string, string> = {
  success: 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-300',
  info: 'border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300',
  warning: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300',
  error: 'border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300',
  loading: 'border-neutral-500/30 bg-neutral-500/5 text-neutral-600 dark:text-neutral-400',
};
</script>

<template>
  <div
    :class="cn(
      'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all',
      typeStyles[props.type],
      props.class,
    )"
    role="alert"
    aria-live="polite"
  >
    <component
      :is="props.icon || icons[props.type]"
      v-if="props.showIcon"
      :class="cn('size-5 shrink-0', props.type === 'loading' && 'animate-spin')"
    />
    <div class="flex-1">
      <p v-if="props.message" class="font-medium">{{ props.message }}</p>
      <p v-if="props.description" class="text-xs opacity-80">{{ props.description }}</p>
      <slot></slot>
    </div>
    <button
      v-if="props.closable"
      :aria-label="'关闭'"
      class="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
      type="button"
      @click="emit('close')"
    >
      <X class="size-4" />
    </button>
  </div>
</template>
