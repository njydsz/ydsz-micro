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

interface NotificationItem {
  description?: string;
  duration?: number;
  icon?: any;
  id: string;
  message: string;
  placement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showIcon?: boolean;
  type?: 'error' | 'info' | 'success' | 'warning';
}

const props = withDefaults(defineProps<NotificationItem>(), {
  duration: 4500,
  placement: 'top-right',
  showIcon: true,
  type: 'info',
});

const emit = defineEmits<{
  close: [id: string];
}>();

const icons: Record<string, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertCircle,
  error: AlertCircle,
};

const typeStyles: Record<string, string> = {
  success: 'border-l-green-500',
  info: 'border-l-blue-500',
  warning: 'border-l-amber-500',
  error: 'border-l-red-500',
};
</script>

<template>
  <div
    :class="cn(
      'pointer-events-auto flex items-start gap-3 border-l-4 bg-background px-4 py-3 shadow-xl transition-all',
      'animate-in slide-in-from-right-full duration-300',
      typeStyles[props.type ?? 'info'],
      props.class,
    )"
    role="alert"
    aria-live="assertive"
  >
    <component
      :is="props.icon || icons[props.type ?? 'info']"
      v-if="props.showIcon"
      :class="
        cn(
          'mt-0.5 size-5 shrink-0',
          props.type === 'success' && 'text-green-500',
          props.type === 'info' && 'text-blue-500',
          props.type === 'warning' && 'text-amber-500',
          props.type === 'error' && 'text-red-500',
        )
      "
    />
    <div class="flex-1">
      <p class="text-sm font-semibold text-foreground">{{ props.message }}</p>
      <p v-if="props.description" class="mt-0.5 text-xs text-muted-foreground">
        {{ props.description }}
      </p>
      <slot></slot>
    </div>
    <button
      :aria-label="'关闭通知'"
      class="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      type="button"
      @click="emit('close', props.id)"
    >
      <X class="size-4" />
    </button>
  </div>
</template>
