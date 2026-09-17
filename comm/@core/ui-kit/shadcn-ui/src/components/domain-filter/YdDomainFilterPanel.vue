<!--
 * 左侧域/分类筛选面板：仿 ForgeLab forge-admin 业务域筛选面板。
 *
 * 设计目标：
 *  - 通用左侧筛选面板，适配业务域、空间、分类、目录等场景；
 *  - 支持全选项 + N 个域选项 + 每项计数徽章；
 *  - 支持可选的搜索框（过滤域列表）和"新建"按钮。
 *
 * 交互：
 *  - 单击选项选中（single-select）；
 *  - 全选项始终在顶部，选中后其他项取消；
 *  - 支持 v-model 双向绑定选中值（'top-code' 或各项 code）。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\domain-filter\YdDomainFilterPanel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { ChevronRight, FolderOpen, Search } from 'lucide-vue-next';

defineOptions({
  name: 'YdDomainFilterPanel',
});

export interface DomainItem {
  code: string;
  count?: number;
  description?: string;
  name: string;
}

interface Props {
  /** 底部提示文字 */
  bottomHint?: string;
  /** 自定义类名 */
  class?: string;
  /** 数据列表 */
  items: DomainItem[];
  /** 是否显示新建按钮 */
  showAdd?: boolean;
  /** 是否显示搜索框 */
  showSearch?: boolean;
  /** 新建按钮文案 */
  addText?: string;
  /** 面板标题 */
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  addText: '新建',
  bottomHint: '',
  items: () => [],
  showAdd: false,
  showSearch: true,
  title: '业务域',
});

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'select', code: string): void;
}>();

const selected = defineModel<string>({ default: 'all' });

/** 计算总数 */
const totalCount = computed<number>(() => {
  return props.items.reduce((sum: number, item: DomainItem) => sum + (item.count ?? 0), 0);
});

/** 搜索关键字 */
const searchKeyword = ref('');

/** 过滤后的列表 */
const filteredItems = computed<DomainItem[]>(() => {
  if (!searchKeyword.value.trim()) {
    return props.items;
  }
  const keyword = searchKeyword.value.trim().toLowerCase();
  return props.items.filter(
    (item: DomainItem) =>
      item.name.toLowerCase().includes(keyword)
      || item.code.toLowerCase().includes(keyword),
  );
});

/** 处理选项点击 */
function handleSelect(code: string): void {
  selected.value = code;
  emit('select', code);
}

/** 处理新建按钮 */
function handleAdd(): void {
  emit('add');
}
</script>

<template>
  <div
    :class="
      cn(
        'flex h-full w-full flex-col rounded-xl border border-border-subtle bg-surface-2 p-3',
        props.class,
      )
    "
  >
    <!-- 头部：标题 + 计数 -->
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-medium text-text-primary">
        {{ title }}
        <span class="ms-1 text-xs text-text-tertiary">· {{ items.length }}</span>
      </h3>
      <button
        v-if="showAdd"
        class="flex h-6 items-center gap-1 rounded-md bg-primary/10 px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        type="button"
        @click="handleAdd"
      >
        +
        {{ addText }}
      </button>
    </div>

    <!-- 搜索框 -->
    <div
      v-if="showSearch"
      class="relative mb-3"
    >
      <Search
        :size="14"
        class="absolute start-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
      />
      <input
        v-model="searchKeyword"
        class="h-8 w-full rounded-lg border border-border-subtle bg-accent/50 ps-8 text-xs text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
        placeholder="搜索{{ title }}"
        type="text"
      />
    </div>

    <!-- 全选项 -->
    <button
      class="mb-1 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors"
      :class="selected === 'all' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-accent'"
      type="button"
      @click="handleSelect('all')"
    >
      <FolderOpen
        :size="16"
        :class="selected === 'all' ? 'text-primary' : 'text-text-tertiary'"
      />
      <span class="flex-1 truncate">全部{{ title }}</span>
      <span
        class="rounded-md px-1.5 py-0.5 text-xs"
        :class="selected === 'all' ? 'bg-primary/20 text-primary' : 'bg-accent text-text-tertiary'"
      >
        {{ totalCount }}
      </span>
    </button>

    <!-- 域选项列表 -->
    <div class="flex-1 overflow-y-auto">
      <button
        v-for="item in filteredItems"
        :key="item.code"
        class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors"
        :class="selected === item.code ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-accent'"
        type="button"
        @click="handleSelect(item.code)"
      >
        <ChevronRight
          :size="14"
          class="shrink-0 text-text-tertiary transition-transform"
          :class="{ 'rotate-90': selected === item.code }"
        />
        <span
          class="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md text-xs font-medium"
          :class="selected === item.code ? 'bg-primary/20 text-primary' : 'bg-accent text-text-tertiary'"
        >
          域
        </span>
        <span class="flex-1 truncate">{{ item.name }}</span>
        <span
          class="rounded-md px-1.5 py-0.5 text-xs"
          :class="selected === item.code ? 'bg-primary/20 text-primary' : 'bg-accent text-text-tertiary'"
        >
          {{ item.count ?? 0 }}
        </span>
      </button>
    </div>

    <!-- 底部提示 -->
    <div
      v-if="bottomHint"
      class="mt-3 rounded-md bg-accent/60 px-2 py-2 text-xs text-text-tertiary"
    >
      {{ bottomHint }}
    </div>
  </div>
</template>
