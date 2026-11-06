<script setup lang="ts">
/**
 * YdTabsPro 配置式标签页 —— 对齐 AntD / Element Plus Tabs 的高级能力。
 *
 * 在 Radix TabsRoot 之上提供：
 *  - `items` 配置式渲染（label + content + disabled + closable）；
 *  - `editable` 可编辑模式（新增 / 关闭标签）；
 *  - `draggable` 拖拽排序（HTML5 drag & drop）；
 *  - `addable` 显示「新增」按钮；
 *  - `keepAlive` 面板保活（未激活面板不销毁）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\tabs\YdTabsPro.vue
 * @author ydsz-team
 * @since 1.0.0
 */

import type { TabsRootProps } from '@ydsz-core/ydsz-vue';

import { computed, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { TabsRoot } from '@ydsz-core/ydsz-vue';

import YdTabsContent from './YdTabsContent.vue';
import YdTabsList from './YdTabsList.vue';
import YdTabsTrigger from './YdTabsTrigger.vue';

/** 单个标签页配置 */
export interface TabItem {
  /** 唯一 key（与 v-model 值对应） */
  key: string;
  /** 标签标题 */
  label: string;
  /** 面板内容（字符串或 slot 名） */
  content?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可关闭 */
  closable?: boolean;
  /** 自定义图标（Iconify 名或任意渲染内容） */
  icon?: string;
}

export interface YdTabsProProps {
  /** 标签页配置列表 */
  items: TabItem[];
  /** 当前激活的 key（受控） */
  modelValue?: string;
  /** 默认激活 key（非受控） */
  defaultValue?: string;
  /** 是否可编辑（显示关闭按钮 + 新增按钮） */
  editable?: boolean;
  /** 是否显示「新增」按钮（editable 为 true 时生效） */
  addable?: boolean;
  /** 是否可拖拽排序 */
  draggable?: boolean;
  /** 面板保活（未激活面板不销毁） */
  keepAlive?: boolean;
  /** 自定义类名 */
  class?: string;
  /** Radix TabsRoot: 标签方向 */
  orientation?: TabsRootProps['orientation'];
  /** Radix TabsRoot: 激活模式 */
  activationMode?: TabsRootProps['activationMode'];
  /** Radix TabsRoot: 文本方向 */
  dir?: TabsRootProps['dir'];
}

const props = withDefaults(defineProps<YdTabsProProps>(), {
  editable: false,
  addable: false,
  draggable: false,
  keepAlive: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  tabChange: [key: string];
  tabRemove: [key: string];
  tabAdd: [];
  tabReorder: [items: TabItem[]];
}>();

/* ============================================================ */
/* 激活值管理                                                     */
/* ============================================================ */

const internalValue = ref<string>(props.defaultValue ?? props.items[0]?.key ?? '');

/** 处理 Radix TabsRoot 的 update:modelValue */
function handleUpdateModelValue(value: string | undefined): void {
  if (value !== undefined) activeKey.value = value;
}

const activeKey = computed<string>({
  get: () => props.modelValue ?? internalValue.value,
  set: (value: string) => {
    internalValue.value = value;
    emit('update:modelValue', value);
    emit('tabChange', value);
  },
});

watch(
  () => props.items,
  (items) => {
    if (items.length === 0) {
      activeKey.value = '';
      return;
    }
    if (!items.some((item) => item.key === activeKey.value)) {
      activeKey.value = items[0]!.key;
    }
  },
);

/* ============================================================ */
/* 可编辑：新增 / 关闭                                            */
/* ============================================================ */

/** 新增标签（仅触发事件，由调用方更新 items） */
function handleAdd(): void {
  emit('tabAdd');
}

/** 关闭标签 */
function handleRemove(key: string, event: Event): void {
  event.stopPropagation();
  emit('tabRemove', key);
  // 若关闭的是当前激活项，切换到相邻项
  const idx = props.items.findIndex((item) => item.key === key);
  if (key === activeKey.value && props.items.length > 1) {
    const next = props.items[idx + 1] ?? props.items[idx - 1];
    if (next) activeKey.value = next.key;
  }
}

/* ============================================================ */
/* 拖拽排序                                                       */
/* ============================================================ */

const dragIndex = ref<number>(-1);
const dragOverIndex = ref<number>(-1);

function handleDragStart(index: number, event: DragEvent): void {
  if (!props.draggable) return;
  dragIndex.value = index;
  event.dataTransfer?.setData('text/plain', String(index));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(index: number, event: DragEvent): void {
  if (!props.draggable) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  dragOverIndex.value = index;
}

function handleDrop(index: number, event: DragEvent): void {
  if (!props.draggable) return;
  event.preventDefault();
  const from = dragIndex.value;
  const to = index;
  dragIndex.value = -1;
  dragOverIndex.value = -1;
  if (from === -1 || from === to) return;
  const next = [...props.items];
  const [moved] = next.splice(from, 1);
  if (!moved) return;
  next.splice(to, 0, moved);
  emit('tabReorder', next);
}

function handleDragEnd(): void {
  dragIndex.value = -1;
  dragOverIndex.value = -1;
}

/* ============================================================ */
/* 已渲染面板缓存（keepAlive）                                    */
/* ============================================================ */

const renderedKeys = ref<Set<string>>(new Set([activeKey.value]));

watch(activeKey, (key) => {
  if (props.keepAlive && key) {
    renderedKeys.value = new Set(renderedKeys.value).add(key);
  }
});
</script>

<template>
  <TabsRoot
    :model-value="activeKey"
    :orientation="props.orientation"
    :activation-mode="props.activationMode"
    :dir="props.dir"
    @update:model-value="handleUpdateModelValue($event)"
  >
    <div :class="cn('flex flex-col', props.class)">
      <!-- 标签栏 -->
      <YdTabsList>
        <YdTabsTrigger
          v-for="(item, index) in props.items"
          :key="item.key"
          :value="item.key"
          :disabled="item.disabled"
          :draggable="props.draggable"
          :class="
            cn(
              props.draggable && 'cursor-grab active:cursor-grabbing',
              dragOverIndex === index && dragIndex !== index && 'ring-primary ring-1',
              dragIndex === index && 'opacity-50',
            )
          "
          @dragstart="handleDragStart(index, $event)"
          @dragover="handleDragOver(index, $event)"
          @drop="handleDrop(index, $event)"
          @dragend="handleDragEnd"
        >
          <span v-if="item.icon" class="mr-1 inline-block size-3.5" aria-hidden="true">
            {{ item.icon }}
          </span>
          {{ item.label }}
          <!-- 关闭按钮 -->
          <button
            v-if="props.editable && (item.closable ?? true)"
            type="button"
            class="text-muted-foreground hover:bg-muted hover:text-foreground ml-1.5 inline-flex size-4 items-center justify-center rounded-sm"
            :aria-label="`Close ${item.label}`"
            @click="handleRemove(item.key, $event)"
          >
            <svg
              aria-hidden="true"
              class="size-3"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </YdTabsTrigger>

        <!-- 新增按钮 -->
        <button
          v-if="props.editable && props.addable"
          type="button"
          class="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center justify-center rounded-md px-2 py-1 text-sm"
          aria-label="Add tab"
          @click="handleAdd"
        >
          <svg
            aria-hidden="true"
            class="size-3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </YdTabsList>

      <!-- 面板区 -->
      <div class="mt-2">
        <template v-for="item in props.items" :key="item.key">
          <YdTabsContent
            v-if="!props.keepAlive || renderedKeys.has(item.key)"
            :value="item.key"
            :force-mount="props.keepAlive"
            :class="cn(activeKey !== item.key && props.keepAlive && 'hidden')"
          >
            <slot :name="item.key" :item="item">{{ item.content }}</slot>
          </YdTabsContent>
        </template>
      </div>
    </div>
  </TabsRoot>
</template>
