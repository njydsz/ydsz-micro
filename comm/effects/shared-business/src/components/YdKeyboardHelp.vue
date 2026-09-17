<!--
 * 快捷键帮助面板 — 按 `?` 或配置键唤起，展示已注册快捷键
 *
 * 使用自研 shadcn YdDialog + YdBadge，零 element-plus 依赖。
 *
 * @path comm\effects\shared-business\src\components\keyboard-help.vue
 * @author ydsz-team
 * @since 1.1.0
-->
<script lang="ts" setup>
/**
 * 快捷键帮助面板 — 按 `?` 或配置键唤起，展示已注册快捷键
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import {
  YdBadge,
  YdDialog,
  YdDialogContent,
  YdDialogHeader,
  YdDialogTitle,
} from '@ydsz-core/shadcn-ui';

import { bindGlobalShortcut, type ShortcutDescriptor } from '../composables/use-keyboard-shortcut';

defineOptions({ name: 'YdKeyboardHelp' });

interface Props {
  /** 快捷键列表 */
  shortcuts: Array<ShortcutDescriptor & { label: string }>;
  /** 唤起键，默认 '?' */
  triggerKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  shortcuts: () => [],
  triggerKey: '?',
});

const visible = ref(false);
let unbindFn: (() => void) | null = null;

/** 修饰键 -> 展示文案 */
function formatShortcut(desc: ShortcutDescriptor): string {
  const parts: string[] = [];
  if (desc.modifiers?.includes('ctrl')) parts.push('Ctrl');
  if (desc.modifiers?.includes('shift')) parts.push('Shift');
  if (desc.modifiers?.includes('alt')) parts.push('Alt');
  if (desc.modifiers?.includes('meta')) parts.push('⌘');
  parts.push(desc.key.toUpperCase());
  return parts.join(' + ');
}

const formatted = computed(() =>
  props.shortcuts.map((item) => ({
    ...item,
    display: formatShortcut(item),
  })),
);

onMounted(() => {
  unbindFn = bindGlobalShortcut(
    { key: props.triggerKey.toLowerCase(), allowInInput: true, scope: 'keyboard-help' },
    () => {
      visible.value = !visible.value;
    },
  );
});

onBeforeUnmount(() => {
  unbindFn?.();
});
</script>

<template>
  <YdDialog v-model:open="visible">
    <YdDialogContent class="keyboard-help-modal sm:max-w-md">
      <YdDialogHeader>
        <YdDialogTitle>键盘快捷键</YdDialogTitle>
      </YdDialogHeader>

      <div
        v-if="formatted.length > 0"
        class="keyboard-help"
      >
        <div
          v-for="item in formatted"
          :key="`${item.display}-${item.label}`"
          class="keyboard-help__row"
        >
          <span class="keyboard-help__label">{{ item.label }}</span>
          <YdBadge variant="outline">
            {{ item.display }}
          </YdBadge>
        </div>
      </div>
      <div
        v-else
        class="keyboard-help__empty"
      >
        暂无快捷键配置
      </div>
    </YdDialogContent>
  </YdDialog>
</template>

<style scoped>
.keyboard-help-modal {
  max-width: 480px;
}

.keyboard-help__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  border-bottom: 1px solid hsl(var(--border-subtle, #f0f0f0));
}

.keyboard-help__label {
  font-size: 14px;
  color: hsl(var(--txt-primary, #303133));
}

.keyboard-help__empty {
  text-align: center;
  color: hsl(var(--txt-tertiary, #909399));
  padding: 24px 0;
  font-size: 13px;
}
</style>
