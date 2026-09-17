<!--
 * 上下文帮助提示：页面级轻量级帮助信息条。
 *
 * 设计目标：
 *  - 仿 ForgeLab forge-admin 底部/侧边 "对象和访问入口已移入应用上下文" 提示条；
 *  - 常驻显示一行简要帮助文字 + 问号图标，带 hover tooltip 显示完整说明；
 *  - 支持点击展开为简短帮助文档（内置 modal 风格展开层）；
 *  - 支持 dismissible（用户关闭后通过 localStorage 记录不再显示）。
 *
 * 无障碍：
 *  - 按钮带 aria-label；
 *  - 装饰性图标 aria-hidden。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\context-help\YdContextHelp.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { HelpCircle, Info, X } from 'lucide-vue-next';

defineOptions({
  name: 'YdContextHelp',
});

interface Props {
  /** 是否可被用户关闭（显示 ✕ 按钮） */
  dismissible?: boolean;
  /** 帮助正文（tooltip 或展开层内展示的帮助文案） */
  helpText: string;
  /** dismiss 时 localStorage 的 key，默认自动基于 helpText 计算 */
  storageKey?: string;
  /** 自定义类名 */
  class?: string;
  /** 展示风格：'bar' 横条 / 'inline' 行内气泡 */
  variant?: 'bar' | 'inline';
  /** 简要帮助说明（常驻显示一行） */
  summary: string;
}

const props = withDefaults(defineProps<Props>(), {
  dismissible: false,
  storageKey: '',
  variant: 'bar',
});

const emit = defineEmits<{
  (e: 'dismiss'): void;
}>();

const dismissed = ref<boolean>(false);
const showingDetail = ref<boolean>(false);

/** 计算 storageKey */
const computedStorageKey = computed<string>(() => {
  return props.storageKey || `context-help-${props.helpText.slice(0, 32)}`;
});

/** 挂载时检查是否已 dismissed */
onMounted(() => {
  if (props.dismissible) {
    try {
      dismissed.value = localStorage.getItem(computedStorageKey.value) === '1';
    } catch {
      /* localStorage 不可用时忽略 */
    }
  }
});

/** 关闭帮助 */
function handleDismiss(): void {
  dismissed.value = true;
  emit('dismiss');
  if (props.dismissible) {
    try {
      localStorage.setItem(computedStorageKey.value, '1');
    } catch {
      /* localStorage 不可用时忽略 */
    }
  }
}

/** 切换详情展开 */
function toggleDetail(): void {
  showingDetail.value = !showingDetail.value;
}
</script>

<template>
  <div
    v-if="!dismissed"
    :class="cn('relative', props.class)"
  >
    <!-- 横条风格 -->
    <div
      v-if="variant === 'bar'"
      class="flex items-start gap-2 rounded-lg border border-info-500/20 bg-info-500/10 px-3 py-2.5 text-xs text-info-700 dark:text-info-400"
    >
      <Info
        :size="14"
        class="mt-0.5 shrink-0"
        aria-hidden="true"
      />
      <div class="flex-1 leading-relaxed">
        <span class="font-medium">{{ summary }}</span>
        <button
          class="ms-2 inline-flex items-center gap-0.5 text-info-600 underline underline-offset-2 hover:text-info-800 dark:hover:text-info-300"
          type="button"
          @click="toggleDetail"
        >
          了解更多
          <HelpCircle :size="12" />
        </button>
      </div>
      <button
        v-if="dismissible"
        class="ms-2 shrink-0 text-info-400 transition-colors hover:text-info-600"
        type="button"
        aria-label="关闭帮助"
        @click="handleDismiss"
      >
        <X :size="14" />
      </button>
    </div>

    <!-- 行内气泡风格 -->
    <div
      v-else
      class="inline-flex items-center gap-1.5 text-xs text-text-tertiary"
    >
      <HelpCircle
        :size="14"
        class="shrink-0"
        aria-hidden="true"
      />
      <span>{{ summary }}</span>
      <button
        class="text-info-500 underline underline-offset-2 hover:text-info-600"
        type="button"
        @click="toggleDetail"
      >
        详情
      </button>
    </div>

    <!-- 详情浮层 -->
    <div
      v-if="showingDetail"
      class="absolute start-0 top-full z-20 mt-2 max-w-[320px] rounded-lg border border-border-subtle bg-surface-2 p-3 text-xs text-text-secondary shadow-raised"
    >
      <p class="leading-relaxed">{{ helpText }}</p>
      <button
        class="mt-2 text-xs text-info-500 hover:text-info-600"
        type="button"
        @click="toggleDetail"
      >
        收起
      </button>
    </div>
  </div>
</template>
