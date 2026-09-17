<!--
 * YdMentionMenu —— @提及/候选人下拉菜单。
 *
 * <p>通过 Suggestion 插件的 render 回调驱动：
 * <ul>
 *   <li>状态由 suggestion 插件管理（position / items / selected index）</li>
 *   <li>键盘事件：ArrowUp/ArrowDown 选择，Enter/Tab 确认，Escape 关闭</li>
 *   <li>点击外部区域自动关闭</li>
 * </ul>
 *
 * @path comm\@core/ui-kit/editor-ui\src\mention-menu.vue
 * @author ydsz-team
 * @since 5.6.0
-->
<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import type { MentionItem } from './extensions/mention';

interface Props {
  /** 候选列表 */
  items?: MentionItem[];
  /** 当前选中索引 */
  selectedIndex?: number;
  /** 选择事件 */
  select?: (index: number) => void;
  /** 位置信息 */
  position?: { top: number; left: number };
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  position: () => ({ left: 0, top: 0 }),
  selectedIndex: 0,
  select: () => {},
});

const emit = defineEmits<{
  select: [index: number];
}>();

const rootRef = ref<HTMLElement>();

const style = computed(() => ({
  left: `${props.position.left}px`,
  position: 'absolute' as const,
  top: `${props.position.top}px`,
  zIndex: 1000,
}));

function handleMouseDown(event: MouseEvent): void {
  // 阻止 blur 导致编辑器失焦
  event.preventDefault();
}

function handleSelect(index: number): void {
  emit('select', index);
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    emit('select', Math.min((props.selectedIndex ?? 0) + 1, (props.items.length - 1)));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    emit('select', Math.max((props.selectedIndex ?? 0) - 1, 0));
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    ref="rootRef"
    :style="style"
    class="mention-menu z-50 max-h-72 w-64 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    role="listbox"
    aria-orientation="vertical"
    :aria-activedescendant="`mention-option-${selectedIndex}`"
    @mousedown="handleMouseDown"
  >
    <!-- 空态 -->
    <div
      v-if="items.length === 0"
      class="px-3 py-2 text-sm text-muted-foreground"
      role="option"
      aria-selected="false"
    >
      无匹配用户
    </div>

    <!-- 候选列表 -->
    <button
      v-for="(item, idx) in items"
      :key="item.id"
      :id="`mention-option-${idx}`"
      type="button"
      role="option"
      :aria-selected="idx === (selectedIndex ?? 0)"
      :class="[
        'inline-flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors',
        idx === (selectedIndex ?? 0) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
      ]"
      @click="handleSelect(idx)"
      @mousedown.prevent="handleSelect(idx)"
    >
      <span
        v-if="item.avatar"
        class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium"
      >
        {{ item.avatar }}
      </span>
      <span class="flex-1 truncate">{{ item.label }}</span>
      <span
        v-if="item.description"
        class="shrink-0 text-xs text-muted-foreground"
      >
        {{ item.description }}
      </span>
    </button>
  </div>
</template>
